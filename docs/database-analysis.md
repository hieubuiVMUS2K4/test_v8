# 📊 Database Structure Analysis

## Current Structure Assessment

### ✅ Strengths

1. **Well-normalized design** following 3NF principles
2. **Clear hierarchical organization** (Department → Major → Class → Student)
3. **Flexible exam system** with proper separation of concerns
4. **Smart question types** supporting both single-choice and multiple-choice questions
5. **Good performance optimization** with strategic indexes
6. **Unicode support** for Vietnamese content

### 🔧 Suggested Improvements

#### 1. Add Timestamps for Audit Trail

```sql
-- Add to all tables for better tracking
ALTER TABLE Students ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE Students ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

ALTER TABLE Exams ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE Exams ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Apply to other critical tables
```

#### 2. Enhanced Exam Security

```sql
-- Add exam security features
ALTER TABLE Exams ADD COLUMN ip_address VARCHAR(45); -- Support IPv6
ALTER TABLE Exams ADD COLUMN user_agent TEXT;
ALTER TABLE Exams ADD COLUMN browser_fingerprint VARCHAR(255);

-- Prevent multiple active exams
CREATE UNIQUE INDEX idx_active_exam_per_student
ON Exams(student_id, topic_id)
WHERE status = 'IN_PROGRESS';
```

#### 3. Better Question Management & Multiple Choice Logic

```sql
-- Add question difficulty and categories
ALTER TABLE Questions ADD COLUMN difficulty ENUM('EASY', 'MEDIUM', 'HARD') DEFAULT 'MEDIUM';
ALTER TABLE Questions ADD COLUMN category VARCHAR(100);
ALTER TABLE Questions ADD COLUMN explanation TEXT; -- For answer explanation
ALTER TABLE Questions ADD COLUMN is_active BOOLEAN DEFAULT TRUE;

-- Question ordering
ALTER TABLE Questions ADD COLUMN order_index INT DEFAULT 0;
CREATE INDEX idx_questions_topic_order ON Questions(topic_id, order_index);

-- Important: Current design correctly handles:
-- is_multiple_choice = FALSE: Single correct answer (radio button style)
-- is_multiple_choice = TRUE: Multiple correct answers (checkbox style)

-- Add validation for multiple choice logic
ALTER TABLE Questions ADD COLUMN min_correct_answers INT DEFAULT 1;
ALTER TABLE Questions ADD COLUMN max_correct_answers INT DEFAULT 1;

-- Update constraints based on question type
-- For single choice: exactly 1 correct answer
-- For multiple choice: 1 or more correct answers
```

#### 4. Enhanced Scheduling System

```sql
-- More flexible scheduling
ALTER TABLE Schedules ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE Schedules ADD COLUMN max_attempts INT DEFAULT 1;
ALTER TABLE Schedules ADD COLUMN shuffle_questions BOOLEAN DEFAULT FALSE;
ALTER TABLE Schedules ADD COLUMN shuffle_answers BOOLEAN DEFAULT FALSE;

-- Class-specific schedules
CREATE TABLE ScheduleClasses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    schedule_id INT NOT NULL,
    class_id INT NOT NULL,
    FOREIGN KEY (schedule_id) REFERENCES Schedules(id),
    FOREIGN KEY (class_id) REFERENCES Classes(id),
    UNIQUE KEY unique_schedule_class (schedule_id, class_id)
);
```

#### 5. Analytics and Reporting Tables

```sql
-- Student performance analytics
CREATE TABLE StudentTopicProgress (
    id INT AUTO_INCREMENT PRIMARY KEY,
    student_id INT NOT NULL,
    topic_id INT NOT NULL,
    total_attempts INT DEFAULT 0,
    best_score DECIMAL(5,2) DEFAULT 0,
    average_score DECIMAL(5,2) DEFAULT 0,
    last_attempt_date DATETIME,
    FOREIGN KEY (student_id) REFERENCES Students(id),
    FOREIGN KEY (topic_id) REFERENCES Topics(id),
    UNIQUE KEY unique_student_topic (student_id, topic_id)
);

-- Question analytics
CREATE TABLE QuestionStatistics (
    id INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    total_attempts INT DEFAULT 0,
    correct_attempts INT DEFAULT 0,
    difficulty_score DECIMAL(3,2) DEFAULT 0, -- 0-1 scale
    discrimination_index DECIMAL(3,2) DEFAULT 0,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES Questions(id),
    UNIQUE KEY unique_question_stats (question_id)
);
```

#### 6. Additional Indexes for Performance

```sql
-- Performance optimization indexes
CREATE INDEX idx_users_role ON Users(role);
CREATE INDEX idx_students_code ON Students(student_code);
CREATE INDEX idx_exam_answers_answer ON ExamAnswers(answer_id);
CREATE INDEX idx_topics_active ON Topics(id) WHERE question_count > 0;

-- Composite indexes for common queries
CREATE INDEX idx_classes_major_year ON Classes(major_id, course_year);
CREATE INDEX idx_exams_student_status_topic ON Exams(student_id, status, topic_id);
```

### 🔐 Security Considerations

#### 1. Add Constraints

```sql
-- Ensure positive values
ALTER TABLE Topics ADD CONSTRAINT chk_duration_positive CHECK (duration_minutes > 0);
ALTER TABLE Topics ADD CONSTRAINT chk_pass_score_valid CHECK (pass_score >= 0 AND pass_score <= 100);
ALTER TABLE Exams ADD CONSTRAINT chk_score_valid CHECK (score >= 0 AND score <= 100);

-- Ensure logical time constraints
ALTER TABLE Exams ADD CONSTRAINT chk_exam_time_valid CHECK (end_time > start_time);
ALTER TABLE Schedules ADD CONSTRAINT chk_schedule_time_valid CHECK (end > start);
```

#### 2. Views for Security

```sql
-- Student view (hide sensitive data)
CREATE VIEW StudentView AS
SELECT
    s.id, s.student_code, s.phone_number,
    u.username, u.email, u.full_name,
    c.name as class_name, c.course_year,
    m.name as major_name,
    d.name as department_name
FROM Students s
JOIN Users u ON s.user_id = u.id
JOIN Classes c ON s.class_id = c.id
JOIN Majors m ON c.major_id = m.id
JOIN Departments d ON m.department_id = d.id
WHERE u.role = 'STUDENT';
```

### 📈 Performance Monitoring

```sql
-- Create a performance log table
CREATE TABLE QueryPerformanceLogs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    query_type VARCHAR(50),
    execution_time_ms INT,
    affected_rows INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_perf_query_type (query_type),
    INDEX idx_perf_created_at (created_at)
);
```

## Implementation Priority

1. **High Priority**: Timestamps, Security constraints, Question management
2. **Medium Priority**: Analytics tables, Enhanced scheduling
3. **Low Priority**: Performance monitoring, Additional views

## Conclusion

The current database structure is solid and well-designed. The suggested improvements focus on:

- Enhanced security and audit capabilities
- Better analytics and reporting
- Improved performance monitoring
- More flexible question and schedule management

These changes should be implemented incrementally to avoid disrupting the existing system.
