-- Script siêu đơn giản - chạy từng lệnh một
-- Bước 1: Backup
DROP TABLE IF EXISTS ExamAnswers_backup;
CREATE TABLE ExamAnswers_backup AS SELECT * FROM ExamAnswers;

-- Bước 2: Kiểm tra trùng lặp
SELECT exam_id, question_id, COUNT(*) as cnt
FROM ExamAnswers 
GROUP BY exam_id, question_id 
HAVING cnt > 1 
ORDER BY cnt DESC;

-- Bước 3: Đếm sẽ xóa bao nhiêu
SELECT 
  COUNT(*) - COUNT(DISTINCT exam_id, question_id) as records_to_delete,
  COUNT(*) as total_before,
  COUNT(DISTINCT exam_id, question_id) as will_remain
FROM ExamAnswers;

-- Bước 4: XÓA (chỉ giữ ID lớn nhất)
DELETE ea1 FROM ExamAnswers ea1
INNER JOIN ExamAnswers ea2 ON 
  ea1.exam_id = ea2.exam_id 
  AND ea1.question_id = ea2.question_id 
  AND ea1.id < ea2.id;

-- Bước 5: Kiểm tra kết quả
SELECT COUNT(*) as total_after FROM ExamAnswers;

-- Bước 6: Kiểm tra còn trùng lặp không
SELECT COUNT(*) as remaining_duplicates
FROM (
  SELECT exam_id, question_id 
  FROM ExamAnswers 
  GROUP BY exam_id, question_id 
  HAVING COUNT(*) > 1
) t;
