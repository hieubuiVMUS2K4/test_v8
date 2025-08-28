-- Script tương thích với MySQL 5.7 và cũ hơn
-- Làm sạch ExamAnswers trùng lặp mà không dùng Window Functions

-- 1. Backup dữ liệu
DROP TABLE IF EXISTS ExamAnswers_backup;
CREATE TABLE ExamAnswers_backup AS SELECT * FROM ExamAnswers;

-- 2. Phân tích dữ liệu trùng lặp
SELECT 'PHÂN TÍCH DỮ LIỆU TRÙNG LẶP:' as title;

SELECT 
  exam_id,
  question_id,
  COUNT(*) as duplicate_count,
  MIN(id) as first_id,
  MAX(id) as last_id
FROM ExamAnswers
GROUP BY exam_id, question_id
HAVING duplicate_count > 1
ORDER BY duplicate_count DESC;

-- 3. Đếm tổng số bản ghi trùng lặp
SELECT 
  CONCAT('Có ', COUNT(*), ' cặp (exam_id, question_id) bị trùng lặp') as summary
FROM (
  SELECT exam_id, question_id
  FROM ExamAnswers
  GROUP BY exam_id, question_id
  HAVING COUNT(*) > 1
) as duplicates;

-- 4. Đếm tổng số bản ghi sẽ bị xóa
SELECT 
  CONCAT('Sẽ xóa ', SUM(cnt - 1), ' bản ghi (giữ lại ID lớn nhất)') as delete_summary
FROM (
  SELECT COUNT(*) as cnt
  FROM ExamAnswers
  GROUP BY exam_id, question_id
  HAVING cnt > 1
) as duplicate_counts;

-- 5. XÓA CÁC BẢN GHI TRÙNG LẶP 
-- Chỉ giữ lại bản ghi có ID lớn nhất cho mỗi cặp (exam_id, question_id)
DELETE ea1 FROM ExamAnswers ea1
INNER JOIN ExamAnswers ea2 ON 
  ea1.exam_id = ea2.exam_id 
  AND ea1.question_id = ea2.question_id 
  AND ea1.id < ea2.id;

-- 6. Kiểm tra kết quả
SELECT 'KẾT QUẢ SAU KHI LÀM SẠCH:' as result_title;

SELECT CONCAT('Tổng số ExamAnswers còn lại: ', COUNT(*)) as final_count
FROM ExamAnswers;

-- Kiểm tra còn trùng lặp không
SELECT 
  CASE 
    WHEN COUNT(*) = 0 THEN '✅ THÀNH CÔNG - Không còn trùng lặp!'
    ELSE CONCAT('❌ Vẫn còn ', COUNT(*), ' trường hợp trùng lặp')
  END as duplicate_check_result
FROM (
  SELECT exam_id, question_id
  FROM ExamAnswers
  GROUP BY exam_id, question_id
  HAVING COUNT(*) > 1
) as remaining_duplicates;

-- 7. So sánh trước và sau
SELECT 
  'TRƯỚC' as timing,
  COUNT(*) as total_records
FROM ExamAnswers_backup
UNION ALL
SELECT 
  'SAU' as timing,
  COUNT(*) as total_records
FROM ExamAnswers;

-- 8. Hiển thị hướng dẫn rollback
SELECT 'ĐỂ ROLLBACK NẾU CẦN:' as rollback_title;

SELECT 'DROP TABLE ExamAnswers; RENAME TABLE ExamAnswers_backup TO ExamAnswers;' as rollback_command;

SELECT '🎉 ExamAnswers cleanup HOÀN THÀNH!' as final_status;
