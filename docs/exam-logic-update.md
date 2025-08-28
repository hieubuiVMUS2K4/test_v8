# 🔄 Exam Logic Update - Ghi đè thay vì tạo mới

## Thay đổi Logic

### ❌ **Logic cũ:**

- Mỗi lần thi tạo 1 bản ghi mới trong bảng Exams
- Sinh viên có thể có nhiều bản ghi cho cùng 1 chuyên đề
- Cần GROUP BY và MAX() để lấy điểm cao nhất
- Dữ liệu thừa và phức tạp

### ✅ **Logic mới:**

- **1 sinh viên + 1 chuyên đề = 1 bản ghi duy nhất**
- Ghi đè bản ghi cũ khi làm lại
- Tracking số lần thử và thời gian
- Dữ liệu gọn gàng và báo cáo đơn giản

## Cấu trúc Database Mới

```sql
CREATE TABLE Exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    topic_id INT NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    score DECIMAL(5,2),
    status ENUM('IN_PROGRESS', 'SUBMITTED', 'REVIEWED') DEFAULT 'IN_PROGRESS',
    duration_minutes INT DEFAULT 0,
    attempts_count INT DEFAULT 1,
    first_attempt_date DATETIME,
    last_attempt_date DATETIME,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES Students(id),
    FOREIGN KEY (topic_id) REFERENCES Topics(id),
    UNIQUE KEY unique_student_topic (student_id, topic_id)
);
```

## Các thay đổi chính

### 1. **Cột mới:**

- `duration_minutes`: Thời gian làm bài (phút)
- `attempts_count`: Số lần thử
- `first_attempt_date`: Lần đầu tiên làm
- `last_attempt_date`: Lần gần nhất làm
- `created_at`, `updated_at`: Tracking thời gian

### 2. **UNIQUE Constraint:**

- `UNIQUE KEY unique_student_topic (student_id, topic_id)`
- Đảm bảo 1 sinh viên chỉ có 1 bản ghi/chuyên đề

### 3. **Logic Backend:**

- `Exam.create()`: Sử dụng INSERT ... ON DUPLICATE KEY UPDATE
- `Exam.submitExam()`: Ghi đè bản ghi thay vì UPDATE theo ID
- Tự động tính duration_minutes và cập nhật attempts_count

## Lợi ích

### 📊 **Báo cáo đơn giản:**

```sql
-- Trước: Cần GROUP BY phức tạp
SELECT student_id, topic_id, MAX(score) as best_score
FROM Exams
GROUP BY student_id, topic_id;

-- Sau: Truy vấn đơn giản
SELECT student_id, topic_id, score
FROM Exams;
```

### 🎯 **Logic rõ ràng:**

- Điểm hiển thị = Điểm cuối cùng
- Không cần phân biệt "điểm tốt nhất" vs "điểm gần nhất"
- Dễ hiểu cho cả dev và user

### 🚀 **Hiệu suất tốt:**

- Ít dữ liệu hơn
- Truy vấn nhanh hơn
- Index hiệu quả hơn

## Migration Steps

1. **Chạy script cập nhật:**

   ```bash
   mysql -u username -p database_name < updateExamLogic.sql
   ```

2. **Deploy backend mới**
3. **Test chức năng thi:**

   - Thi lần đầu: Tạo bản ghi mới
   - Thi lại: Ghi đè bản ghi cũ
   - Kiểm tra attempts_count tăng đúng

4. **Kiểm tra báo cáo:**
   - Thống kê sinh viên
   - Thống kế chuyên đề
   - Báo cáo chi tiết

## Backward Compatibility

- ✅ Frontend không cần thay đổi
- ✅ API endpoints giữ nguyên
- ✅ Dữ liệu cũ được migrate tự động
- ✅ Báo cáo vẫn hoạt động bình thường

## Notes

- Script migration sẽ giữ lại bản ghi có điểm cao nhất cho mỗi sinh viên+chuyên đề
- Dữ liệu cũ sẽ được backup trước khi xóa
- Có thể rollback nếu cần thiết
