// Script kiểm tra tính toàn vẹn và cấu trúc database
require('dotenv').config();
const DatabaseService = require('../src/services/DatabaseService');

async function validateDatabaseStructure() {
  try {
    console.log('🔍 VMU Quiz System - Database Validation');
    console.log('==========================================');

    // 1. Kiểm tra kết nối database
    console.log('📡 Kiểm tra kết nối database...');
    await DatabaseService.execute('SELECT 1');
    console.log('   ✅ Kết nối database thành công');

    // 2. Kiểm tra các bảng cần thiết
    console.log('\n📋 Kiểm tra các bảng cần thiết...');
    const requiredTables = [
      'Users', 'Departments', 'Majors', 'Classes', 'Students',
      'Topics', 'Questions', 'Answers', 'Exams', 'ExamAnswers', 'Schedules'
    ];

    for (const tableName of requiredTables) {
      try {
        const result = await DatabaseService.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        console.log(`   ✅ ${tableName}: ${result[0].count} bản ghi`);
      } catch (err) {
        console.log(`   ❌ ${tableName}: Không tồn tại hoặc lỗi`);
      }
    }

    // 3. Kiểm tra cấu trúc bảng Exams
    console.log('\n🔧 Kiểm tra cấu trúc bảng Exams...');
    try {
      const examsStructure = await DatabaseService.execute('DESCRIBE Exams');
      const expectedColumns = {
        'id': 'int',
        'student_id': 'int',
        'topic_id': 'int',
        'start_time': 'datetime',
        'end_time': 'datetime',
        'score': 'decimal',
        'status': 'enum'
      };

      let examsValid = true;
      for (const [colName, colType] of Object.entries(expectedColumns)) {
        const column = examsStructure.find(col => col.Field === colName);
        if (!column) {
          console.log(`   ❌ Thiếu cột: ${colName}`);
          examsValid = false;
        } else if (!column.Type.toLowerCase().includes(colType)) {
          console.log(`   ⚠️  Cột ${colName} có kiểu dữ liệu không đúng: ${column.Type} (mong đợi: ${colType})`);
        } else {
          console.log(`   ✅ ${colName}: ${column.Type}`);
        }
      }

      if (examsValid) {
        console.log('   ✅ Cấu trúc bảng Exams hợp lệ');
      }
    } catch (err) {
      console.log('   ❌ Không thể kiểm tra bảng Exams:', err.message);
    }

    // 4. Kiểm tra cấu trúc bảng ExamAnswers
    console.log('\n🔧 Kiểm tra cấu trúc bảng ExamAnswers...');
    try {
      const examAnswersStructure = await DatabaseService.execute('DESCRIBE ExamAnswers');
      const expectedColumns = {
        'id': 'int',
        'exam_id': 'int',
        'question_id': 'int',
        'answer_id': 'int',
        'is_selected': 'tinyint'
      };

      let examAnswersValid = true;
      for (const [colName, colType] of Object.entries(expectedColumns)) {
        const column = examAnswersStructure.find(col => col.Field === colName);
        if (!column) {
          console.log(`   ❌ Thiếu cột: ${colName}`);
          examAnswersValid = false;
        } else if (!column.Type.toLowerCase().includes(colType)) {
          console.log(`   ⚠️  Cột ${colName} có kiểu dữ liệu không đúng: ${column.Type} (mong đợi: ${colType})`);
        } else {
          console.log(`   ✅ ${colName}: ${column.Type}`);
        }
      }

      if (examAnswersValid) {
        console.log('   ✅ Cấu trúc bảng ExamAnswers hợp lệ');
      }
    } catch (err) {
      console.log('   ❌ Không thể kiểm tra bảng ExamAnswers:', err.message);
    }

    // 5. Kiểm tra cột is_active trong bảng Answers
    console.log('\n🔧 Kiểm tra cột is_active trong bảng Answers...');
    try {
      const answersStructure = await DatabaseService.execute('DESCRIBE Answers');
      const isActiveColumn = answersStructure.find(col => col.Field === 'is_active');
      if (isActiveColumn) {
        console.log(`   ✅ Cột is_active: ${isActiveColumn.Type}`);
        
        // Kiểm tra dữ liệu
        const inactiveAnswers = await DatabaseService.execute('SELECT COUNT(*) as count FROM Answers WHERE is_active = FALSE');
        const activeAnswers = await DatabaseService.execute('SELECT COUNT(*) as count FROM Answers WHERE is_active = TRUE');
        console.log(`   📊 Câu trả lời active: ${activeAnswers[0].count}, inactive: ${inactiveAnswers[0].count}`);
      } else {
        console.log('   ❌ Thiếu cột is_active');
      }
    } catch (err) {
      console.log('   ❌ Không thể kiểm tra cột is_active:', err.message);
    }

    // 6. Kiểm tra indexes quan trọng
    console.log('\n📈 Kiểm tra indexes quan trọng...');
    const importantIndexes = [
      { table: 'Exams', index: 'idx_exams_student_topic' },
      { table: 'ExamAnswers', index: 'idx_exam_answers_exam_question' },
      { table: 'Questions', index: 'idx_questions_topic' },
      { table: 'Answers', index: 'idx_answers_question' },
      { table: 'Students', index: 'idx_students_user' },
      { table: 'Schedules', index: 'idx_schedules_major_topic' }
    ];

    for (const { table, index } of importantIndexes) {
      try {
        const indexes = await DatabaseService.execute(`SHOW INDEXES FROM ${table}`);
        const foundIndex = indexes.find(idx => idx.Key_name === index);
        if (foundIndex) {
          console.log(`   ✅ ${table}.${index}`);
        } else {
          console.log(`   ❌ Thiếu index: ${table}.${index}`);
        }
      } catch (err) {
        console.log(`   ❌ Không thể kiểm tra indexes của ${table}`);
      }
    }

    // 7. Kiểm tra foreign keys
    console.log('\n🔗 Kiểm tra foreign key constraints...');
    try {
      const fkQuery = `
        SELECT 
          TABLE_NAME, 
          COLUMN_NAME, 
          REFERENCED_TABLE_NAME, 
          REFERENCED_COLUMN_NAME
        FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE 
        WHERE REFERENCED_TABLE_SCHEMA = DATABASE() 
        AND REFERENCED_TABLE_NAME IS NOT NULL
        ORDER BY TABLE_NAME
      `;
      
      const foreignKeys = await DatabaseService.execute(fkQuery);
      console.log(`   📊 Tổng số foreign keys: ${foreignKeys.length}`);
      
      // Nhóm theo bảng
      const fkByTable = {};
      foreignKeys.forEach(fk => {
        if (!fkByTable[fk.TABLE_NAME]) {
          fkByTable[fk.TABLE_NAME] = [];
        }
        fkByTable[fk.TABLE_NAME].push(`${fk.COLUMN_NAME} → ${fk.REFERENCED_TABLE_NAME}.${fk.REFERENCED_COLUMN_NAME}`);
      });

      for (const [tableName, fks] of Object.entries(fkByTable)) {
        console.log(`   📋 ${tableName}: ${fks.length} FK(s)`);
        fks.forEach(fk => console.log(`      - ${fk}`));
      }
    } catch (err) {
      console.log('   ❌ Không thể kiểm tra foreign keys:', err.message);
    }

    // 8. Kiểm tra dữ liệu mẫu
    console.log('\n📊 Tóm tắt dữ liệu...');
    const dataSummary = [
      { table: 'Users', role: 'ADMIN' },
      { table: 'Users', role: 'STUDENT' },
      { table: 'Departments' },
      { table: 'Majors' },
      { table: 'Classes' },
      { table: 'Students' },
      { table: 'Topics' },
      { table: 'Questions' },
      { table: 'Answers' },
      { table: 'Schedules' }
    ];

    for (const item of dataSummary) {
      try {
        let query = `SELECT COUNT(*) as count FROM ${item.table}`;
        if (item.role) {
          query += ` WHERE role = '${item.role}'`;
        }
        
        const result = await DatabaseService.execute(query);
        const label = item.role ? `${item.table} (${item.role})` : item.table;
        console.log(`   📈 ${label}: ${result[0].count} bản ghi`);
      } catch (err) {
        console.log(`   ❌ Không thể kiểm tra ${item.table}`);
      }
    }

    console.log('\n🎉 Hoàn thành kiểm tra database!');
    console.log('💡 Nếu có lỗi, chạy: node scripts/updateDatabaseStructure.js');

  } catch (error) {
    console.error('❌ Lỗi khi kiểm tra database:', error);
    console.error('Stack trace:', error.stack);
  } finally {
    process.exit(0);
  }
}

// Chạy script
validateDatabaseStructure();
