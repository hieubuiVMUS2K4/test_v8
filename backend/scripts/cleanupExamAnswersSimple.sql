-- Script đơn giản để làm sạch ExamAnswers
-- Chỉ giữ lại câu trả lời cuối cùng (ID lớn nhất) cho mỗi exam_id + question_id

-- Backup trước khi xóa
CREATE TABLE ExamAnswers_backup_simple AS SELECT * FROM ExamAnswers;

-- Xóa trực tiếp các câu trả lời cũ, chỉ giữ lại ID lớn nhất
DELETE ea1 FROM ExamAnswers ea1
WHERE ea1.id < (
  SELECT MAX(ea2.id) 
  FROM ExamAnswers_backup_simple ea2 
  WHERE ea2.exam_id = ea1.exam_id 
    AND ea2.question_id = ea1.question_id
);

-- Kiểm tra kết quả
SELECT 
  'Làm sạch hoàn thành!' as status,
  COUNT(*) as total_remaining_answers
FROM ExamAnswers;

-- Kiểm tra không còn trùng lặp
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'Không còn trùng lặp'
    ELSE CONCAT(COUNT(*), ' trường hợp vẫn còn trùng lặp')
  END as duplicate_status
FROM (
  SELECT exam_id, question_id
  FROM ExamAnswers
  GROUP BY exam_id, question_id
  HAVING COUNT(*) > 1
) duplicates;
