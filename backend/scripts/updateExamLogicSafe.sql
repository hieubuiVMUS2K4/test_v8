-- Script an toàn để cập nhật logic Exams với backup dữ liệu
-- Chạy script này thay vì script gốc để đảm bảo an toàn

-- 1. Backup dữ liệu trước khi thay đổi
CREATE TABLE Exams_backup AS SELECT * FROM Exams;
CREATE TABLE ExamAnswers_backup AS SELECT * FROM ExamAnswers;

-- 2. Thêm các cột mới (bỏ qua lỗi nếu cột đã tồn tại)
ALTER TABLE Exams 
ADD COLUMN IF NOT EXISTS duration_minutes INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS attempts_count INT DEFAULT 1,
ADD COLUMN IF NOT EXISTS first_attempt_date DATETIME,
ADD COLUMN IF NOT EXISTS last_attempt_date DATETIME,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 3. Cập nhật dữ liệu hiện có
UPDATE Exams SET 
  first_attempt_date = COALESCE(start_time, NOW()),
  last_attempt_date = COALESCE(end_time, start_time, NOW()),
  duration_minutes = CASE 
    WHEN start_time IS NOT NULL AND end_time IS NOT NULL 
    THEN GREATEST(TIMESTAMPDIFF(MINUTE, start_time, end_time), 0)
    ELSE 0 
  END
WHERE first_attempt_date IS NULL;

-- 4. Kiểm tra xem có dữ liệu trùng lặp không
SELECT 
  student_id, 
  topic_id, 
  COUNT(*) as count,
  GROUP_CONCAT(id) as exam_ids
FROM Exams 
GROUP BY student_id, topic_id 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 5. Nếu có dữ liệu trùng lặp, xử lý theo từng bước
-- Bước 5.1: Tạo bảng tạm chứa bản ghi tốt nhất
CREATE TEMPORARY TABLE temp_best_exams AS
SELECT 
  student_id,
  topic_id,
  score,
  id as keep_id,
  ROW_NUMBER() OVER (
    PARTITION BY student_id, topic_id 
    ORDER BY score DESC, end_time DESC, id DESC
  ) as rn
FROM Exams 
WHERE status = 'SUBMITTED';

-- Chỉ giữ lại bản ghi tốt nhất (rn = 1)
DELETE FROM temp_best_exams WHERE rn > 1;

-- Bước 5.2: Tạo danh sách các exam_id cần xóa
CREATE TEMPORARY TABLE temp_delete_exams AS
SELECT e.id
FROM Exams e
LEFT JOIN temp_best_exams t ON e.student_id = t.student_id 
  AND e.topic_id = t.topic_id 
  AND e.id = t.keep_id
WHERE t.keep_id IS NULL AND e.status = 'SUBMITTED';

-- Bước 5.3: Xử lý ExamAnswers trùng lặp
-- Trước khi xóa, cần giữ lại câu trả lời của bài thi tốt nhất
-- Tạo bảng tạm chứa câu trả lời của các bài thi tốt nhất
CREATE TEMPORARY TABLE temp_keep_answers AS
SELECT ea.*
FROM ExamAnswers ea
INNER JOIN temp_best_exams tbe ON ea.exam_id = tbe.keep_id;

-- Tạo bảng tạm chứa tất cả câu trả lời cần xóa (không phải của bài thi tốt nhất)
CREATE TEMPORARY TABLE temp_delete_answers AS
SELECT ea.id
FROM ExamAnswers ea
LEFT JOIN temp_best_exams tbe ON ea.exam_id = tbe.keep_id
WHERE tbe.keep_id IS NULL;

-- Bước 5.4: Hiển thị thông tin về dữ liệu sẽ bị xóa
SELECT 
  CONCAT('Sẽ xóa ', COUNT(*), ' bản ghi Exams trùng lặp') as info
FROM temp_delete_exams;

SELECT 
  CONCAT('Sẽ xóa ', COUNT(*), ' bản ghi ExamAnswers trùng lặp') as info
FROM temp_delete_answers;

-- Hiển thị chi tiết exam_id nào bị ảnh hưởng
SELECT 
  'Các exam_id sẽ bị xóa:' as title,
  GROUP_CONCAT(id ORDER BY id) as exam_ids_to_delete
FROM temp_delete_exams;

-- Bước 5.5: Xóa dữ liệu theo đúng thứ tự
-- Xóa ExamAnswers trùng lặp trước
DELETE ea FROM ExamAnswers ea
INNER JOIN temp_delete_answers tda ON ea.id = tda.id;

-- Sau đó xóa Exams trùng lặp
DELETE e FROM Exams e
INNER JOIN temp_delete_exams tde ON e.id = tde.id;

-- Bước 5.5: Cập nhật attempts_count cho các bản ghi còn lại
UPDATE Exams e
INNER JOIN temp_best_exams t ON e.id = t.keep_id
SET e.attempts_count = (
  SELECT COUNT(*) 
  FROM Exams_backup eb 
  WHERE eb.student_id = e.student_id 
    AND eb.topic_id = e.topic_id
    AND eb.status = 'SUBMITTED'
);

-- Bước 5.6: Cập nhật lại exam_id trong ExamAnswers để trỏ đến exam tốt nhất
-- (Trường hợp này có thể không cần vì chúng ta đã giữ đúng exam_id từ đầu)

-- Dọn dẹp bảng tạm của ExamAnswers
DROP TEMPORARY TABLE IF EXISTS temp_keep_answers;
DROP TEMPORARY TABLE IF EXISTS temp_delete_answers;

-- 6. Thêm UNIQUE constraint (sẽ báo lỗi nếu vẫn còn trùng lặp)
ALTER TABLE Exams 
ADD CONSTRAINT unique_student_topic UNIQUE (student_id, topic_id);

-- 7. Tạo các index để tối ưu performance
CREATE INDEX IF NOT EXISTS idx_exams_student_topic_score ON Exams(student_id, topic_id, score);
CREATE INDEX IF NOT EXISTS idx_exams_status ON Exams(status);
CREATE INDEX IF NOT EXISTS idx_exams_last_attempt ON Exams(last_attempt_date);

-- 8. Tạo trigger để tự động cập nhật timestamps
DROP TRIGGER IF EXISTS before_exam_update;

DELIMITER $$
CREATE TRIGGER before_exam_update 
BEFORE UPDATE ON Exams
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
  
  -- Nếu đây là attempt mới (score thay đổi và exam được submit)
  IF OLD.score != NEW.score AND NEW.status = 'SUBMITTED' THEN
    SET NEW.last_attempt_date = CURRENT_TIMESTAMP;
  END IF;
END$$
DELIMITER ;

-- 9. Dọn dẹp bảng tạm
DROP TEMPORARY TABLE IF EXISTS temp_best_exams;
DROP TEMPORARY TABLE IF EXISTS temp_delete_exams;

-- 10. Hiển thị kết quả cuối cùng
SELECT 
  'Migration hoàn thành!' as status,
  COUNT(*) as total_exams,
  COUNT(DISTINCT student_id, topic_id) as unique_student_topic_pairs
FROM Exams;

-- 11. Hướng dẫn rollback nếu cần
SELECT 'Để rollback, chạy các lệnh sau:' as rollback_instructions;
SELECT 'DROP TABLE Exams;' as step1;
SELECT 'RENAME TABLE Exams_backup TO Exams;' as step2;
SELECT 'DROP TABLE ExamAnswers;' as step3;
SELECT 'RENAME TABLE ExamAnswers_backup TO ExamAnswers;' as step4;
