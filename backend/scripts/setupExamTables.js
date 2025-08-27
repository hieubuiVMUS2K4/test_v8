// Script to setup the database tables needed for exam functionality
// Updated with correct AUTO_INCREMENT and ENUM status structure

require('dotenv').config();
const DatabaseService = require('../src/services/DatabaseService');

async function setupExamTables() {
  try {
    console.log('🚀 Setting up exam tables with optimized structure...');
    console.log('� Using INT AUTO_INCREMENT for performance and ENUM for status');
    console.log('================================================');

    // Check if Exams table exists
    const examsTableExists = await checkTableExists('Exams');
    if (!examsTableExists) {
      console.log('📋 Creating Exams table with optimized structure...');
      await DatabaseService.execute(`
        CREATE TABLE Exams (
          id INT AUTO_INCREMENT PRIMARY KEY,
          student_id INT NOT NULL,
          topic_id INT NOT NULL,
          start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
          end_time DATETIME NULL,
          score DECIMAL(5,2) NULL,
          status ENUM('IN_PROGRESS', 'SUBMITTED', 'REVIEWED') DEFAULT 'IN_PROGRESS',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (student_id) REFERENCES Students(id) ON DELETE CASCADE,
          FOREIGN KEY (topic_id) REFERENCES Topics(id) ON DELETE CASCADE,
          INDEX idx_exams_student_topic (student_id, topic_id),
          INDEX idx_exams_status (status),
          INDEX idx_exams_start_time (start_time)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('   ✅ Exams table created with performance indexes');
    } else {
      console.log('   ✅ Exams table already exists');
      
      // Kiểm tra và cập nhật cấu trúc nếu cần
      await validateExamsTableStructure();
    }

    // Check if ExamAnswers table exists
    const examAnswersTableExists = await checkTableExists('ExamAnswers');
    if (!examAnswersTableExists) {
      console.log('📋 Creating ExamAnswers table with optimized structure...');
      await DatabaseService.execute(`
        CREATE TABLE ExamAnswers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          exam_id INT NOT NULL,
          question_id INT NOT NULL,
          answer_id INT NULL,
          is_selected BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (exam_id) REFERENCES Exams(id) ON DELETE CASCADE,
          FOREIGN KEY (question_id) REFERENCES Questions(id) ON DELETE CASCADE,
          FOREIGN KEY (answer_id) REFERENCES Answers(id) ON DELETE SET NULL,
          INDEX idx_exam_answers_exam_question (exam_id, question_id),
          INDEX idx_exam_answers_selected (is_selected),
          UNIQUE KEY unique_exam_question_answer (exam_id, question_id, answer_id)
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
      `);
      console.log('   ✅ ExamAnswers table created with performance indexes');
    } else {
      console.log('   ✅ ExamAnswers table already exists');
      
      // Kiểm tra và cập nhật cấu trúc nếu cần
      await validateExamAnswersTableStructure();
    }

    console.log('\n🎉 All exam tables have been set up successfully!');
    
    // Hiển thị thống kê
    await displayTableStatistics();
    
    console.log('\n💡 Next steps:');
    console.log('   1. Run: npm run seed (create test users)');
    console.log('   2. Run: npm run seed:topics (create sample topics)');
    console.log('   3. Run: npm run seed:questions (create sample questions)');
    console.log('   4. Run: npm run validate:db (validate setup)');
    console.log('\n📖 For more info, see: DATABASE_SETUP.md');
  } catch (error) {
    console.error('❌ Error setting up exam tables:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

async function checkTableExists(tableName) {
  const query = `
    SELECT COUNT(*) as count 
    FROM information_schema.tables 
    WHERE table_schema = DATABASE() 
    AND table_name = ?
  `;
  const result = await DatabaseService.execute(query, [tableName]);
  return result[0].count > 0;
}

// Validate Exams table structure
async function validateExamsTableStructure() {
  try {
    console.log('   🔍 Validating Exams table structure...');
    
    const structure = await DatabaseService.execute('DESCRIBE Exams');
    const columns = structure.map(col => col.Field);
    
    // Check required columns
    const requiredColumns = ['id', 'student_id', 'topic_id', 'start_time', 'end_time', 'score', 'status'];
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`   ⚠️  Missing columns: ${missingColumns.join(', ')}`);
    }
    
    // Check ID type
    const idColumn = structure.find(col => col.Field === 'id');
    if (idColumn && !idColumn.Type.includes('int')) {
      console.log(`   ⚠️  ID column type should be INT, found: ${idColumn.Type}`);
    }
    
    // Check status enum
    const statusColumn = structure.find(col => col.Field === 'status');
    if (statusColumn && !statusColumn.Type.includes('enum')) {
      console.log(`   ⚠️  Status column should be ENUM, found: ${statusColumn.Type}`);
    }
    
    // Check indexes
    const indexes = await DatabaseService.execute('SHOW INDEXES FROM Exams');
    const indexNames = indexes.map(idx => idx.Key_name);
    
    const requiredIndexes = ['idx_exams_student_topic', 'idx_exams_status'];
    const missingIndexes = requiredIndexes.filter(idx => !indexNames.includes(idx));
    
    if (missingIndexes.length > 0) {
      console.log(`   📈 Creating missing indexes: ${missingIndexes.join(', ')}`);
      
      for (const indexName of missingIndexes) {
        try {
          if (indexName === 'idx_exams_student_topic') {
            await DatabaseService.execute('CREATE INDEX idx_exams_student_topic ON Exams(student_id, topic_id)');
          } else if (indexName === 'idx_exams_status') {
            await DatabaseService.execute('CREATE INDEX idx_exams_status ON Exams(status)');
          }
          console.log(`      ✅ Created index: ${indexName}`);
        } catch (err) {
          console.log(`      ⚠️  Could not create index ${indexName}: ${err.message}`);
        }
      }
    }
    
    console.log('   ✅ Exams table validation completed');
  } catch (error) {
    console.log(`   ❌ Error validating Exams table: ${error.message}`);
  }
}

// Validate ExamAnswers table structure
async function validateExamAnswersTableStructure() {
  try {
    console.log('   🔍 Validating ExamAnswers table structure...');
    
    const structure = await DatabaseService.execute('DESCRIBE ExamAnswers');
    const columns = structure.map(col => col.Field);
    
    // Check required columns
    const requiredColumns = ['id', 'exam_id', 'question_id', 'answer_id', 'is_selected'];
    const missingColumns = requiredColumns.filter(col => !columns.includes(col));
    
    if (missingColumns.length > 0) {
      console.log(`   ⚠️  Missing columns: ${missingColumns.join(', ')}`);
    }
    
    // Check indexes
    const indexes = await DatabaseService.execute('SHOW INDEXES FROM ExamAnswers');
    const indexNames = indexes.map(idx => idx.Key_name);
    
    const requiredIndexes = ['idx_exam_answers_exam_question'];
    const missingIndexes = requiredIndexes.filter(idx => !indexNames.includes(idx));
    
    if (missingIndexes.length > 0) {
      console.log(`   📈 Creating missing indexes: ${missingIndexes.join(', ')}`);
      
      try {
        await DatabaseService.execute('CREATE INDEX idx_exam_answers_exam_question ON ExamAnswers(exam_id, question_id)');
        console.log('      ✅ Created index: idx_exam_answers_exam_question');
      } catch (err) {
        console.log(`      ⚠️  Could not create index: ${err.message}`);
      }
    }
    
    console.log('   ✅ ExamAnswers table validation completed');
  } catch (error) {
    console.log(`   ❌ Error validating ExamAnswers table: ${error.message}`);
  }
}

// Display table statistics
async function displayTableStatistics() {
  try {
    console.log('\n📊 Table Statistics:');
    console.log('====================');
    
    // Exams statistics
    const examStats = await DatabaseService.execute(`
      SELECT 
        COUNT(*) as total_exams,
        COUNT(CASE WHEN status = 'IN_PROGRESS' THEN 1 END) as in_progress,
        COUNT(CASE WHEN status = 'SUBMITTED' THEN 1 END) as submitted,
        COUNT(CASE WHEN status = 'REVIEWED' THEN 1 END) as reviewed
      FROM Exams
    `);
    
    if (examStats.length > 0) {
      const stats = examStats[0];
      console.log(`📋 Exams: ${stats.total_exams} total`);
      console.log(`   - IN_PROGRESS: ${stats.in_progress}`);
      console.log(`   - SUBMITTED: ${stats.submitted}`);
      console.log(`   - REVIEWED: ${stats.reviewed}`);
    }
    
    // ExamAnswers statistics
    const answerStats = await DatabaseService.execute('SELECT COUNT(*) as count FROM ExamAnswers');
    if (answerStats.length > 0) {
      console.log(`📝 ExamAnswers: ${answerStats[0].count} total`);
    }
    
    // Related tables statistics
    const relatedStats = await DatabaseService.execute(`
      SELECT 
        (SELECT COUNT(*) FROM Students) as students,
        (SELECT COUNT(*) FROM Topics) as topics,
        (SELECT COUNT(*) FROM Questions) as questions,
        (SELECT COUNT(*) FROM Answers WHERE is_active = TRUE) as active_answers
    `);
    
    if (relatedStats.length > 0) {
      const stats = relatedStats[0];
      console.log(`👥 Students: ${stats.students}`);
      console.log(`📚 Topics: ${stats.topics}`);
      console.log(`❓ Questions: ${stats.questions}`);
      console.log(`✅ Active Answers: ${stats.active_answers}`);
    }
    
  } catch (error) {
    console.log(`❌ Error displaying statistics: ${error.message}`);
  }
}

// Run the script
console.log('🚀 VMU Quiz System - Exam Tables Setup');
console.log('=======================================');
setupExamTables();
