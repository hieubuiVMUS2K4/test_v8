-- Script cập nhật cấu trúc CSDL theo thiết kế chuẩn
-- Chạy script này để đồng bộ cấu trúc database

-- 1. Drop và tạo lại bảng Exams với cấu trúc đúng
DROP TABLE IF EXISTS ExamAnswers;
DROP TABLE IF EXISTS Exams;

CREATE TABLE Exams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    topic_id INT NOT NULL,
    start_time DATETIME,
    end_time DATETIME,
    score DECIMAL(5,2),
    status ENUM('IN_PROGRESS', 'SUBMITTED', 'REVIEWED') DEFAULT 'IN_PROGRESS',
    FOREIGN KEY (student_id) REFERENCES Students(id),
    FOREIGN KEY (topic_id) REFERENCES Topics(id)
);

-- 2. Tạo lại bảng ExamAnswers với cấu trúc đúng
CREATE TABLE ExamAnswers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    exam_id INT NOT NULL,
    question_id INT NOT NULL,
    answer_id INT,
    is_selected BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (exam_id) REFERENCES Exams(id),
    FOREIGN KEY (question_id) REFERENCES Questions(id),
    FOREIGN KEY (answer_id) REFERENCES Answers(id)
);

-- 3. Tạo indexes cho hiệu năng
-- Exam-related indexes
CREATE INDEX idx_exams_student_topic ON Exams(student_id, topic_id);
CREATE INDEX idx_exams_status ON Exams(status);
CREATE INDEX idx_exams_start_time ON Exams(start_time);

-- ExamAnswers indexes (quan trọng nhất cho hiệu năng)
CREATE INDEX idx_exam_answers_exam_question ON ExamAnswers(exam_id, question_id);
CREATE INDEX idx_exam_answers_selected ON ExamAnswers(is_selected);

-- 4. Đảm bảo cột is_active tồn tại trong bảng Answers
ALTER TABLE Answers ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
UPDATE Answers SET is_active = TRUE WHERE is_active IS NULL;

-- 5. Kiểm tra và thêm các indexes còn thiếu
-- Questions/Answers indexes
CREATE INDEX IF NOT EXISTS idx_questions_topic ON Questions(topic_id);
CREATE INDEX IF NOT EXISTS idx_answers_question ON Answers(question_id);
CREATE INDEX IF NOT EXISTS idx_answers_active ON Answers(is_active);

-- Student/User indexes
CREATE INDEX IF NOT EXISTS idx_students_user ON Students(user_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON Students(class_id);

-- Schedule indexes
CREATE INDEX IF NOT EXISTS idx_schedules_major_topic ON Schedules(major_id, topic_id);
CREATE INDEX IF NOT EXISTS idx_schedules_department ON Schedules(department_id);

-- Class hierarchy indexes
CREATE INDEX IF NOT EXISTS idx_classes_major ON Classes(major_id);
CREATE INDEX IF NOT EXISTS idx_majors_department ON Majors(department_id);

-- 6. Hiển thị kết quả
SELECT 'Database structure updated successfully!' as Message;

-- Kiểm tra cấu trúc các bảng quan trọng
DESCRIBE Exams;
DESCRIBE ExamAnswers;
DESCRIBE Answers;

-- Kiểm tra indexes
SHOW INDEXES FROM Exams;
SHOW INDEXES FROM ExamAnswers;
