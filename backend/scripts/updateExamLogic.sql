-- Cập nhật logic bảng Exams để ghi đè thay vì tạo mới
-- Script này sẽ thêm UNIQUE constraint và các cột cần thiết

-- 1. Thêm các cột để tracking
ALTER TABLE Exams 
ADD COLUMN duration_minutes INT DEFAULT 0,
ADD COLUMN attempts_count INT DEFAULT 1,
ADD COLUMN first_attempt_date DATETIME,
ADD COLUMN last_attempt_date DATETIME,
ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- 2. Cập nhật dữ liệu hiện có
UPDATE Exams SET 
  first_attempt_date = COALESCE(start_time, created_at),
  last_attempt_date = COALESCE(end_time, created_at),
  duration_minutes = CASE 
    WHEN start_time IS NOT NULL AND end_time IS NOT NULL 
    THEN TIMESTAMPDIFF(MINUTE, start_time, end_time)
    ELSE 0 
  END
WHERE first_attempt_date IS NULL;

-- 3. Xử lý dữ liệu trùng lặp trước khi thêm UNIQUE constraint
-- Giữ lại bản ghi có điểm cao nhất cho mỗi student_id + topic_id
CREATE TEMPORARY TABLE temp_best_exams AS
SELECT 
  student_id,
  topic_id,
  MAX(score) as best_score,
  MAX(id) as keep_id
FROM Exams 
GROUP BY student_id, topic_id;

-- Tạo temporary table chứa các ID cần xóa
CREATE TEMPORARY TABLE temp_delete_exams AS
SELECT e.id
FROM Exams e
LEFT JOIN temp_best_exams t ON e.student_id = t.student_id 
  AND e.topic_id = t.topic_id 
  AND e.id = t.keep_id
WHERE t.keep_id IS NULL;

-- Xóa ExamAnswers trước (vì có foreign key constraint)
DELETE ea FROM ExamAnswers ea
INNER JOIN temp_delete_exams tde ON ea.exam_id = tde.id;

-- Sau đó xóa các bản ghi Exams không phải là điểm cao nhất
DELETE e FROM Exams e
INNER JOIN temp_delete_exams tde ON e.id = tde.id;

-- Cập nhật attempts_count cho các bản ghi còn lại
UPDATE Exams e
SET attempts_count = (
  SELECT COUNT(*) 
  FROM (SELECT * FROM Exams) e2 
  WHERE e2.student_id = e.student_id 
    AND e2.topic_id = e.topic_id
);

-- 4. Thêm UNIQUE constraint để đảm bảo 1 sinh viên chỉ có 1 bản ghi/chuyên đề
ALTER TABLE Exams 
ADD CONSTRAINT unique_student_topic UNIQUE (student_id, topic_id);

-- 5. Tạo index để tối ưu performance
CREATE INDEX idx_exams_student_topic_score ON Exams(student_id, topic_id, score);
CREATE INDEX idx_exams_status ON Exams(status);
CREATE INDEX idx_exams_last_attempt ON Exams(last_attempt_date);

-- 6. Tạo trigger để tự động cập nhật timestamps
DELIMITER $$
CREATE TRIGGER before_exam_update 
BEFORE UPDATE ON Exams
FOR EACH ROW
BEGIN
  SET NEW.updated_at = CURRENT_TIMESTAMP;
  
  -- Nếu đây là attempt mới (score thay đổi)
  IF OLD.score != NEW.score THEN
    SET NEW.attempts_count = OLD.attempts_count + 1;
    SET NEW.last_attempt_date = CURRENT_TIMESTAMP;
  END IF;
END$$
DELIMITER ;

DROP TEMPORARY TABLE temp_best_exams;
DROP TEMPORARY TABLE temp_delete_exams;
