-- Script chuyên dụng để làm sạch dữ liệu ExamAnswers trùng lặp
-- Chỉ xử lý bảng ExamAnswers, không động vào bảng Exams

-- 1. Backup ExamAnswers trước khi xử lý
DROP TABLE IF EXISTS ExamAnswers_backup;
CREATE TABLE ExamAnswers_backup AS SELECT * FROM ExamAnswers;

-- 2. Phân tích dữ liệu trùng lặp trong ExamAnswers
SELECT 'PHÂN TÍCH DỮ LIỆU TRÙNG LẶP:' as analysis_title;

SELECT 
  ea.exam_id,
  COUNT(*) as total_answers,
  COUNT(DISTINCT ea.question_id) as unique_questions,
  ROUND(COUNT(*) / COUNT(DISTINCT ea.question_id), 0) as estimated_attempts
FROM ExamAnswers ea
GROUP BY ea.exam_id
HAVING estimated_attempts > 1
ORDER BY estimated_attempts DESC, ea.exam_id;

-- 3. Tạo bảng tạm để phân nhóm câu trả lời theo attempt
-- Sử dụng cách tương thích với MySQL cũ (không dùng ROW_NUMBER)
CREATE TEMPORARY TABLE temp_answer_attempts AS
SELECT 
  ea.*,
  (
    SELECT COUNT(*) + 1
    FROM ExamAnswers ea2 
    WHERE ea2.exam_id = ea.exam_id 
      AND ea2.question_id = ea.question_id 
      AND ea2.id < ea.id
  ) as attempt_number
FROM ExamAnswers ea;

-- 4. Tìm attempt cuối cùng (số attempt cao nhất) cho mỗi exam_id + question_id
CREATE TEMPORARY TABLE temp_final_attempts AS
SELECT 
  exam_id,
  question_id,
  MAX(attempt_number) as final_attempt_number
FROM temp_answer_attempts
GROUP BY exam_id, question_id;

-- 5. Xác định ID của các câu trả lời cuối cùng cần giữ lại
CREATE TEMPORARY TABLE temp_keep_answers AS
SELECT taa.id
FROM temp_answer_attempts taa
INNER JOIN temp_final_attempts tfa ON 
  taa.exam_id = tfa.exam_id 
  AND taa.question_id = tfa.question_id 
  AND taa.attempt_number = tfa.final_attempt_number;

-- 6. Xác định ID của các câu trả lời cũ cần xóa
CREATE TEMPORARY TABLE temp_delete_answers AS
SELECT ea.id
FROM ExamAnswers ea
LEFT JOIN temp_keep_answers tka ON ea.id = tka.id
WHERE tka.id IS NULL;

-- 7. Hiển thị thông tin chi tiết trước khi xóa
SELECT 'THÔNG TIN TRƯỚC KHI XÓA:' as info_title;

SELECT CONCAT('Tổng số ExamAnswers hiện tại: ', COUNT(*)) as current_total
FROM ExamAnswers;

SELECT CONCAT('Sẽ giữ lại: ', COUNT(*), ' câu trả lời (attempt cuối cùng)') as keep_count
FROM temp_keep_answers;

SELECT CONCAT('Sẽ xóa: ', COUNT(*), ' câu trả lời (attempt cũ)') as delete_count
FROM temp_delete_answers;

-- Hiển thị chi tiết exam_id nào bị ảnh hưởng
SELECT 'Các exam_id có câu trả lời trùng lặp sẽ bị làm sạch:' as affected_title;
SELECT 
  ea.exam_id,
  COUNT(*) as answers_to_delete
FROM ExamAnswers ea
INNER JOIN temp_delete_answers tda ON ea.id = tda.id
GROUP BY ea.exam_id
ORDER BY answers_to_delete DESC;

-- 8. XÓA CÁC CÂU TRẢ LỜI CŨ (chỉ giữ lại attempt cuối cùng)
DELETE ea FROM ExamAnswers ea
INNER JOIN temp_delete_answers tda ON ea.id = tda.id;

-- 9. Kiểm tra kết quả sau khi xóa
SELECT 'KẾT QUẢ SAU KHI LÀM SẠCH:' as result_title;

SELECT CONCAT('Số ExamAnswers sau khi làm sạch: ', COUNT(*)) as final_total
FROM ExamAnswers;

-- Kiểm tra xem còn trùng lặp không
SELECT 'Kiểm tra còn trùng lặp không:' as check_title;
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN 'KHÔNG còn trùng lặp - Làm sạch thành công!'
    ELSE CONCAT('Vẫn còn ', COUNT(*), ' trường hợp trùng lặp')
  END as duplicate_check
FROM (
  SELECT exam_id, question_id, COUNT(*) as cnt
  FROM ExamAnswers
  GROUP BY exam_id, question_id
  HAVING cnt > 1
) as duplicates;

-- 10. Dọn dẹp bảng tạm
DROP TEMPORARY TABLE temp_answer_attempts;
DROP TEMPORARY TABLE temp_final_attempts;
DROP TEMPORARY TABLE temp_keep_answers;
DROP TEMPORARY TABLE temp_delete_answers;

-- 11. Thông báo hoàn thành
SELECT 'ExamAnswers cleanup HOÀN THÀNH!' as final_status;
SELECT 'Để rollback nếu cần: DROP TABLE ExamAnswers; RENAME TABLE ExamAnswers_backup TO ExamAnswers;' as rollback_hint;
