// Script Node.js để cập nhật cấu trúc database theo thiết kế chuẩn
require('dotenv').config();
const DatabaseService = require('../src/services/DatabaseService');

async function updateDatabaseStructure() {
  try {
    console.log('🔄 Bắt đầu cập nhật cấu trúc database...');

    // 1. Kiểm tra và backup dữ liệu cũ (nếu có)
    console.log('📊 Kiểm tra dữ liệu hiện tại...');
    
    try {
      const oldExams = await DatabaseService.execute('SELECT COUNT(*) as count FROM Exams');
      console.log(`   Tìm thấy ${oldExams[0].count} bài thi cũ`);
      
      const oldExamAnswers = await DatabaseService.execute('SELECT COUNT(*) as count FROM ExamAnswers');
      console.log(`   Tìm thấy ${oldExamAnswers[0].count} câu trả lời cũ`);
    } catch (err) {
      console.log('   Không tìm thấy dữ liệu cũ hoặc bảng chưa tồn tại');
    }

    // 2. Drop và tạo lại bảng Exams với cấu trúc đúng
    console.log('🗑️  Xóa bảng cũ...');
    
    await DatabaseService.execute('SET FOREIGN_KEY_CHECKS = 0');
    
    try {
      await DatabaseService.execute('DROP TABLE IF EXISTS ExamAnswers');
      console.log('   ✅ Đã xóa bảng ExamAnswers cũ');
    } catch (err) {
      console.log('   ⚠️  Bảng ExamAnswers không tồn tại');
    }
    
    try {
      await DatabaseService.execute('DROP TABLE IF EXISTS Exams');
      console.log('   ✅ Đã xóa bảng Exams cũ');
    } catch (err) {
      console.log('   ⚠️  Bảng Exams không tồn tại');
    }

    await DatabaseService.execute('SET FOREIGN_KEY_CHECKS = 1');

    // 3. Tạo bảng Exams mới
    console.log('🆕 Tạo bảng Exams mới...');
    await DatabaseService.execute(`
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
      )
    `);
    console.log('   ✅ Tạo bảng Exams thành công');

    // 4. Tạo bảng ExamAnswers mới
    console.log('🆕 Tạo bảng ExamAnswers mới...');
    await DatabaseService.execute(`
      CREATE TABLE ExamAnswers (
        id INT AUTO_INCREMENT PRIMARY KEY,
        exam_id INT NOT NULL,
        question_id INT NOT NULL,
        answer_id INT,
        is_selected BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (exam_id) REFERENCES Exams(id),
        FOREIGN KEY (question_id) REFERENCES Questions(id),
        FOREIGN KEY (answer_id) REFERENCES Answers(id)
      )
    `);
    console.log('   ✅ Tạo bảng ExamAnswers thành công');

    // 5. Thêm cột is_active vào bảng Answers (nếu chưa có)
    console.log('🔧 Kiểm tra cột is_active...');
    try {
      await DatabaseService.execute('ALTER TABLE Answers ADD COLUMN is_active BOOLEAN DEFAULT TRUE');
      console.log('   ✅ Đã thêm cột is_active');
    } catch (err) {
      if (err.message.includes('Duplicate column name')) {
        console.log('   ✅ Cột is_active đã tồn tại');
      } else {
        throw err;
      }
    }
    
    // Cập nhật giá trị mặc định
    await DatabaseService.execute('UPDATE Answers SET is_active = TRUE WHERE is_active IS NULL');
    console.log('   ✅ Đã cập nhật giá trị is_active');

    // 6. Tạo indexes cho hiệu năng
    console.log('📈 Tạo indexes...');
    
    const indexes = [
      // Exam indexes
      'CREATE INDEX idx_exams_student_topic ON Exams(student_id, topic_id)',
      'CREATE INDEX idx_exams_status ON Exams(status)',
      'CREATE INDEX idx_exams_start_time ON Exams(start_time)',
      
      // ExamAnswers indexes
      'CREATE INDEX idx_exam_answers_exam_question ON ExamAnswers(exam_id, question_id)',
      'CREATE INDEX idx_exam_answers_selected ON ExamAnswers(is_selected)',
      
      // Questions/Answers indexes
      'CREATE INDEX idx_questions_topic ON Questions(topic_id)',
      'CREATE INDEX idx_answers_question ON Answers(question_id)',
      'CREATE INDEX idx_answers_active ON Answers(is_active)',
      
      // Student/User indexes
      'CREATE INDEX idx_students_user ON Students(user_id)',
      'CREATE INDEX idx_students_class ON Students(class_id)',
      
      // Schedule indexes
      'CREATE INDEX idx_schedules_major_topic ON Schedules(major_id, topic_id)',
      'CREATE INDEX idx_schedules_department ON Schedules(department_id)',
      
      // Class hierarchy indexes
      'CREATE INDEX idx_classes_major ON Classes(major_id)',
      'CREATE INDEX idx_majors_department ON Majors(department_id)'
    ];

    for (const indexSql of indexes) {
      try {
        await DatabaseService.execute(indexSql);
        const indexName = indexSql.match(/INDEX (\w+)/)[1];
        console.log(`   ✅ Đã tạo index: ${indexName}`);
      } catch (err) {
        if (err.message.includes('Duplicate key name')) {
          const indexName = indexSql.match(/INDEX (\w+)/)[1];
          console.log(`   ⚠️  Index đã tồn tại: ${indexName}`);
        } else {
          console.error(`   ❌ Lỗi tạo index: ${err.message}`);
        }
      }
    }

    // 7. Kiểm tra kết quả
    console.log('✅ Kiểm tra kết quả...');
    
    const examsStructure = await DatabaseService.execute('DESCRIBE Exams');
    console.log('   📋 Cấu trúc bảng Exams:');
    examsStructure.forEach(col => {
      console.log(`      ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? `(${col.Key})` : ''}`);
    });

    const examAnswersStructure = await DatabaseService.execute('DESCRIBE ExamAnswers');
    console.log('   📋 Cấu trúc bảng ExamAnswers:');
    examAnswersStructure.forEach(col => {
      console.log(`      ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : ''} ${col.Key ? `(${col.Key})` : ''}`);
    });

    const indexesExams = await DatabaseService.execute('SHOW INDEXES FROM Exams');
    console.log(`   📊 Tổng số indexes bảng Exams: ${indexesExams.length}`);

    const indexesExamAnswers = await DatabaseService.execute('SHOW INDEXES FROM ExamAnswers');
    console.log(`   📊 Tổng số indexes bảng ExamAnswers: ${indexesExamAnswers.length}`);

    console.log('\n🎉 Cập nhật cấu trúc database thành công!');
    console.log('💡 Gợi ý: Chạy script seed để tạo dữ liệu mẫu:');
    console.log('   npm run seed');

  } catch (error) {
    console.error('❌ Lỗi khi cập nhật cấu trúc database:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Chạy script
console.log('🚀 VMU Quiz System - Database Structure Update');
console.log('================================================');
updateDatabaseStructure();
