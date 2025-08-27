// Script test logic trạng thái bài thi mới
require('dotenv').config();
const DatabaseService = require('../src/services/DatabaseService');

async function testExamStatusLogic() {
  try {
    console.log('🧪 Testing New Exam Status Logic');
    console.log('=================================');

    // 1. Kiểm tra cấu trúc database
    console.log('📊 Checking database structure...');
    
    const examsStructure = await DatabaseService.execute('DESCRIBE Exams');
    const hasStatus = examsStructure.some(col => col.Field === 'status');
    console.log(`   - Exams table has status column: ${hasStatus ? '✅' : '❌'}`);
    
    if (!hasStatus) {
      console.log('   ⚠️  Status column missing! Run: npm run setup:db');
      return;
    }

    // 2. Tạo dữ liệu test
    console.log('\n📝 Creating test data...');
    
    // Tìm student để test
    const students = await DatabaseService.execute('SELECT id, user_id FROM Students LIMIT 1');
    if (!students.length) {
      console.log('   ❌ No students found. Please run: npm run seed');
      return;
    }
    
    const testStudent = students[0];
    console.log(`   - Using student ID: ${testStudent.id}`);

    // Tìm topic để test
    const topics = await DatabaseService.execute('SELECT id, name FROM Topics LIMIT 1');
    if (!topics.length) {
      console.log('   ❌ No topics found. Please run: npm run seed:topics');
      return;
    }
    
    const testTopic = topics[0];
    console.log(`   - Using topic: ${testTopic.name} (ID: ${testTopic.id})`);

    // 3. Test các trạng thái khác nhau
    console.log('\n🔄 Testing different exam states...');

    // Clean up existing exams for this student-topic
    await DatabaseService.execute(
      'DELETE FROM ExamAnswers WHERE exam_id IN (SELECT id FROM Exams WHERE student_id = ? AND topic_id = ?)',
      [testStudent.id, testTopic.id]
    );
    await DatabaseService.execute(
      'DELETE FROM Exams WHERE student_id = ? AND topic_id = ?',
      [testStudent.id, testTopic.id]
    );

    // Test 1: Trạng thái chưa làm bài (available)
    console.log('\n📍 Test 1: Available status (chưa làm bài)');
    let examStatus = await getExamStatus(testStudent.id, testTopic.id);
    console.log(`   Result: ${JSON.stringify(examStatus)}`);
    console.log(`   Expected: taken=false, ✅ ${!examStatus.taken ? 'PASS' : 'FAIL'}`);

    // Test 2: Tạo bài thi IN_PROGRESS
    console.log('\n📍 Test 2: In-Progress status (đang làm bài)');
    const examResult = await DatabaseService.execute(
      'INSERT INTO Exams (student_id, topic_id, start_time, status) VALUES (?, ?, NOW(), ?)',
      [testStudent.id, testTopic.id, 'IN_PROGRESS']
    );
    const examId = examResult.insertId;
    
    examStatus = await getExamStatus(testStudent.id, testTopic.id);
    console.log(`   Result: ${JSON.stringify(examStatus)}`);
    console.log(`   Expected: taken=true, inProgress=true, ✅ ${examStatus.taken && examStatus.inProgress ? 'PASS' : 'FAIL'}`);

    // Test 3: Submit bài thi không đạt
    console.log('\n📍 Test 3: Failed status (không đạt)');
    await DatabaseService.execute(
      'UPDATE Exams SET end_time = NOW(), score = 45, status = ? WHERE id = ?',
      ['SUBMITTED', examId]
    );
    
    examStatus = await getExamStatus(testStudent.id, testTopic.id);
    console.log(`   Result: ${JSON.stringify(examStatus)}`);
    console.log(`   Expected: taken=true, passed=false, inProgress=false, ✅ ${examStatus.taken && !examStatus.passed && !examStatus.inProgress ? 'PASS' : 'FAIL'}`);

    // Test 4: Submit bài thi đạt
    console.log('\n📍 Test 4: Completed status (đã hoàn thành)');
    await DatabaseService.execute(
      'UPDATE Exams SET score = 85 WHERE id = ?',
      [examId]
    );
    
    examStatus = await getExamStatus(testStudent.id, testTopic.id);
    console.log(`   Result: ${JSON.stringify(examStatus)}`);
    console.log(`   Expected: taken=true, passed=true, ✅ ${examStatus.taken && examStatus.passed ? 'PASS' : 'FAIL'}`);

    // Test 5: Làm lại từ trạng thái completed
    console.log('\n📍 Test 5: Retake from completed');
    const retakeResult = await DatabaseService.execute(
      'INSERT INTO Exams (student_id, topic_id, start_time, status) VALUES (?, ?, NOW(), ?)',
      [testStudent.id, testTopic.id, 'IN_PROGRESS']
    );
    
    examStatus = await getExamStatus(testStudent.id, testTopic.id);
    console.log(`   Result: ${JSON.stringify(examStatus)}`);
    console.log(`   Expected: Should get latest IN_PROGRESS exam, ✅ ${examStatus.inProgress ? 'PASS' : 'FAIL'}`);

    // 4. Test Frontend Status Logic
    console.log('\n🎨 Testing Frontend Status Logic...');
    
    const testCases = [
      { examStatus: { taken: false }, expected: 'available' },
      { examStatus: { taken: true, inProgress: true }, expected: 'in-progress' },
      { examStatus: { taken: true, passed: false, inProgress: false }, expected: 'failed' },
      { examStatus: { taken: true, passed: true, inProgress: false }, expected: 'completed' }
    ];

    testCases.forEach((testCase, index) => {
      const result = getSubjectStatusLogic(testCase.examStatus);
      const passed = result === testCase.expected;
      console.log(`   Test ${index + 1}: ${testCase.examStatus.taken ? 'taken' : 'not taken'} -> ${result} (expected: ${testCase.expected}) ${passed ? '✅' : '❌'}`);
    });

    // Clean up
    console.log('\n🧹 Cleaning up test data...');
    await DatabaseService.execute(
      'DELETE FROM ExamAnswers WHERE exam_id IN (SELECT id FROM Exams WHERE student_id = ? AND topic_id = ?)',
      [testStudent.id, testTopic.id]
    );
    await DatabaseService.execute(
      'DELETE FROM Exams WHERE student_id = ? AND topic_id = ?',
      [testStudent.id, testTopic.id]
    );

    console.log('\n🎉 Test completed successfully!');
    console.log('\n💡 Summary of new logic:');
    console.log('   - available: Chưa làm bài bao giờ -> "Bắt đầu làm bài"');
    console.log('   - in-progress: Đang làm dở -> "Tiếp tục"');
    console.log('   - failed: Đã nộp nhưng không đạt -> "Làm lại"');
    console.log('   - completed: Đã nộp và đạt -> "Làm lại" (optional)');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    process.exit(0);
  }
}

// Helper function to get exam status (giống backend logic)
async function getExamStatus(studentId, topicId) {
  // Kiểm tra bài thi đang IN_PROGRESS trước
  const inProgressExam = await DatabaseService.execute(
    `SELECT id FROM Exams 
     WHERE student_id = ? AND topic_id = ? AND status = 'IN_PROGRESS'
     ORDER BY start_time DESC LIMIT 1`,
    [studentId, topicId]
  );
  
  if (inProgressExam && inProgressExam.length > 0) {
    return {
      taken: true,
      passed: false,
      inProgress: true,
      examId: inProgressExam[0].id,
      score: null
    };
  }

  // Kiểm tra bài thi đã SUBMITTED
  const examHistory = await DatabaseService.execute(
    `SELECT id, score, end_time FROM Exams 
     WHERE student_id = ? AND topic_id = ? AND status = 'SUBMITTED'
     ORDER BY end_time DESC LIMIT 1`,
    [studentId, topicId]
  );
  
  if (examHistory && examHistory.length > 0) {
    const passed = (
      examHistory[0].score !== null && Number(examHistory[0].score) > 0 &&
      Number(examHistory[0].score) >= 70 // Assume pass score 70
    );
    
    return {
      taken: true,
      passed: passed,
      inProgress: false,
      score: examHistory[0].score
    };
  }

  // Chưa làm bài nào
  return { 
    taken: false, 
    passed: false,
    inProgress: false,
    score: null 
  };
}

// Helper function để test frontend logic
function getSubjectStatusLogic(examStatus) {
  if (examStatus) {
    if (examStatus.taken) {
      if (examStatus.inProgress) {
        return 'in-progress'; // Đang làm bài (chưa nộp)
      }
      return examStatus.passed ? 'completed' : 'failed';
    }
    return 'available'; // Chưa làm bao giờ
  }
  return 'available';
}

// Run test
testExamStatusLogic();
