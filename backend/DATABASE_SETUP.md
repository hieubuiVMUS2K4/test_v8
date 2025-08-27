# 📊 Database Setup - VMU Quiz System

Hướng dẫn thiết lập và quản lý cơ sở dữ liệu cho hệ thống thi trắc nghiệm VMU.

## 🗄️ Cấu trúc Database

### **Phân cấp tổ chức:**

```
Departments (Khoa)
    └── Majors (Ngành)
        └── Classes (Lớp)
            └── Students (Sinh viên)
```

### **Hệ thống thi:**

```
Topics (Chuyên đề)
    └── Questions (Câu hỏi)
        └── Answers (Đáp án)

Students → Exams → ExamAnswers
```

### **Lịch thi:**

```
Schedules (Lịch thi)
    ├── Department-level (Theo khoa)
    └── Major-level (Theo ngành)
```

## 🛠️ Thiết lập ban đầu

### **1. Cấu hình môi trường:**

```bash
# Tạo file .env
cp .env.example .env

# Cấu hình database trong .env
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=vmu_quiz_db
```

### **2. Cài đặt cấu trúc database:**

```bash
# Cập nhật cấu trúc bảng theo thiết kế chuẩn
npm run setup:db

# Kiểm tra tính toàn vẹn database
npm run validate:db
```

### **3. Tạo dữ liệu mẫu:**

```bash
# Tạo users cơ bản (admin, student)
npm run seed

# Tạo chuyên đề và lịch thi
npm run seed:topics

# Tạo câu hỏi mẫu
npm run seed:questions

# Kiểm tra kết nối và dữ liệu
npm run test:db
```

## 📋 Scripts và Commands

| Script                   | Mô tả                                          |
| ------------------------ | ---------------------------------------------- |
| `npm run setup:db`       | Cập nhật cấu trúc database theo thiết kế chuẩn |
| `npm run validate:db`    | Kiểm tra tính toàn vẹn và cấu trúc database    |
| `npm run seed`           | Tạo users cơ bản (admin, student)              |
| `npm run seed:topics`    | Tạo chuyên đề sinh hoạt công dân và lịch thi   |
| `npm run seed:questions` | Tạo câu hỏi và đáp án mẫu                      |
| `npm run test:db`        | Kiểm tra kết nối database và tài khoản test    |

## 🗃️ Cấu trúc bảng chi tiết

### **Users** - Tài khoản người dùng

```sql
id INT AUTO_INCREMENT PRIMARY KEY
username NVARCHAR(100) UNIQUE NOT NULL
password NVARCHAR(255) NOT NULL  -- Bcrypt hash
role ENUM('STUDENT', 'ADMIN') NOT NULL
email NVARCHAR(150)
full_name NVARCHAR(150)
```

### **Exams** - Bài thi của sinh viên

```sql
id INT AUTO_INCREMENT PRIMARY KEY
student_id INT NOT NULL          -- FK to Students
topic_id INT NOT NULL            -- FK to Topics
start_time DATETIME
end_time DATETIME
score DECIMAL(5,2)              -- Điểm số (0-100)
status ENUM('IN_PROGRESS', 'SUBMITTED', 'REVIEWED')
```

### **ExamAnswers** - Câu trả lời chi tiết

```sql
id INT AUTO_INCREMENT PRIMARY KEY
exam_id INT NOT NULL             -- FK to Exams
question_id INT NOT NULL         -- FK to Questions
answer_id INT                    -- FK to Answers (nullable cho câu không trả lời)
is_selected BOOLEAN DEFAULT FALSE
```

### **Schedules** - Lịch thi theo khoa/ngành

```sql
id INT AUTO_INCREMENT PRIMARY KEY
department_id INT                -- FK to Departments (nullable)
major_id INT NOT NULL           -- FK to Majors
topic_id INT NOT NULL           -- FK to Topics
start DATETIME NOT NULL
end DATETIME NOT NULL
notes NVARCHAR(500)
```

## 🚀 Performance & Indexes

Hệ thống đã được tối ưu với các indexes quan trọng:

### **Exam Performance:**

- `idx_exams_student_topic`: Tìm bài thi theo sinh viên và chuyên đề
- `idx_exams_status`: Lọc theo trạng thái bài thi
- `idx_exam_answers_exam_question`: Truy vấn câu trả lời nhanh

### **Content Performance:**

- `idx_questions_topic`: Lấy câu hỏi theo chuyên đề
- `idx_answers_question`: Lấy đáp án theo câu hỏi
- `idx_answers_active`: Lọc đáp án active

### **Organization Performance:**

- `idx_schedules_major_topic`: Kiểm tra lịch thi
- `idx_students_class`: Quản lý sinh viên theo lớp

## 🔧 Maintenance

### **Kiểm tra sức khỏe database:**

```bash
npm run validate:db
```

### **Reset dữ liệu (cẩn thận!):**

```bash
# Xóa và tạo lại cấu trúc bảng
npm run setup:db

# Tạo lại dữ liệu mẫu
npm run seed
npm run seed:topics
npm run seed:questions
```

### **Backup dữ liệu:**

```bash
mysqldump -u username -p vmu_quiz_db > backup_$(date +%Y%m%d).sql
```

### **Restore từ backup:**

```bash
mysql -u username -p vmu_quiz_db < backup_20250827.sql
```

## ⚠️ Lưu ý quan trọng

1. **Foreign Key Constraints:** Các bảng có liên kết chặt chẽ, cần xóa theo thứ tự
2. **Soft Delete:** Sử dụng cột `is_active` thay vì xóa vật lý
3. **Password Security:** Tất cả mật khẩu đều được hash bằng bcrypt
4. **Performance:** Luôn sử dụng indexes khi query dữ liệu lớn
5. **Data Integrity:** Kiểm tra `validate:db` sau mọi thay đổi cấu trúc

## 🆘 Troubleshooting

### **Lỗi kết nối database:**

```bash
# Kiểm tra file .env
# Đảm bảo MySQL service đang chạy
# Test kết nối
npm run test:db
```

### **Lỗi foreign key:**

```bash
# Tạm tắt foreign key check
SET FOREIGN_KEY_CHECKS = 0;
# Thực hiện thay đổi
SET FOREIGN_KEY_CHECKS = 1;
```

### **Lỗi thiếu index:**

```bash
# Chạy lại setup để tạo indexes
npm run setup:db
```

---

**📝 Cập nhật:** Script được thiết kế để idempotent (chạy nhiều lần an toàn)
**🔐 Bảo mật:** Không commit file .env vào git
