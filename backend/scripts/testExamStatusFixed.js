const DatabaseService = require('../src/services/DatabaseService');

/**
 * Test script để kiểm tra logic trạng thái bài thi sau khi sửa
 * Mô phỏng tình huống: sinh viên làm bài, nộp bài và đã có điểm
 */

async function testExamStatusLogic() {
  console.log('=== TEST EXAM STATUS LOGIC (FIXED) ===\n');
  
  try {
    // Lấy thông tin một bài thi đã SUBMITTED và có điểm
    console.log('1. Lấy bài thi mẫu đã SUBMITTED với điểm...');
    const submittedExam = await DatabaseService.execute(`
      SELECT e.id, e.student_id, e.topic_id, e.status, e.score, e.start_time, e.end_time,
             t.name as topic_name, t.pass_score,
             s.user_id
      FROM Exams e
      INNER JOIN Topics t ON e.topic_id = t.id  
      INNER JOIN Students s ON e.student_id = s.id
      WHERE e.status = 'SUBMITTED' AND e.score IS NOT NULL
      ORDER BY e.end_time DESC
      LIMIT 1
    `);
    
    if (!submittedExam || submittedExam.length === 0) {
      console.log('❌ Không tìm thấy bài thi SUBMITTED nào có điểm để test');
      return;
    }
    
    const exam = submittedExam[0];
    console.log(`✅ Tìm thấy bài thi: ID ${exam.id}, Topic "${exam.topic_name}", Score: ${exam.score}, Pass: ${exam.pass_score}`);
    
    // Mô phỏng logic mới trong studentSubjectsController.js
    console.log('\n2. Kiểm tra logic trạng thái (LOGIC MỚI)...');
    
    const studentId = exam.student_id;
    const topicId = exam.topic_id;
    const topic = {
      id: topicId,
      name: exam.topic_name,
      pass_score: exam.pass_score
    };
    
    // Lấy bài thi gần nhất của student cho topic này (bất kể status)
    console.log('   - Lấy bài thi gần nhất...');
    const latestExam = await DatabaseService.execute(
      `SELECT id, status, score, end_time, start_time FROM Exams 
       WHERE student_id = ? AND topic_id = ? 
       ORDER BY start_time DESC LIMIT 1`,
      [studentId, topicId]
    );
    
    if (latestExam && latestExam.length > 0) {
      const examData = latestExam[0];
      console.log(`   ✅ Bài thi gần nhất: ID ${examData.id}, Status: ${examData.status}, Score: ${examData.score}`);
      
      if (examData.status === 'IN_PROGRESS') {
        console.log('   📝 Trạng thái: IN_PROGRESS - hiển thị "Đang thực hiện"');
        topic.examStatus = {
          taken: true,
          passed: false,
          inProgress: true,
          examId: examData.id,
          score: null
        };
      } else if (examData.status === 'SUBMITTED' || examData.status === 'REVIEWED') {
        console.log('   ✅ Trạng thái: SUBMITTED/REVIEWED - bài thi đã hoàn thành');
        
        const examScore = examData.score;
        const passScore = topic.pass_score;
        
        const passed = (
          examScore !== null && 
          passScore !== null && 
          Number(examScore) >= Number(passScore)
        );
        
        console.log(`   - Điểm thi: ${examScore}, Điểm đạt: ${passScore}`);
        console.log(`   - Kết quả: ${passed ? 'ĐẠT' : 'KHÔNG ĐẠT'}`);
        
        topic.examStatus = {
          taken: true,
          passed: passed,
          inProgress: false, // Đã hoàn thành
          score: examScore
        };
      } else {
        console.log('   ❓ Status khác:', examData.status);
        topic.examStatus = { 
          taken: false, 
          passed: false,
          inProgress: false,
          score: null 
        };
      }
    } else {
      console.log('   ❌ Không tìm thấy bài thi nào');
      topic.examStatus = { 
        taken: false, 
        passed: false,
        inProgress: false,
        score: null 
      };
    }
    
    // Hiển thị kết quả
    console.log('\n3. KẾT QUẢ LOGIC:');
    console.log('=================');
    console.log(`Topic: ${topic.name}`);
    console.log(`Exam Status:`, topic.examStatus);
    
    // Mô phỏng hiển thị trên frontend
    let statusText, statusClass, showContinueButton;
    
    if (topic.examStatus.taken) {
      if (topic.examStatus.inProgress) {
        statusText = 'Đang thực hiện';
        statusClass = 'in-progress';
        showContinueButton = true;
      } else if (topic.examStatus.passed) {
        statusText = 'Hoàn thành';
        statusClass = 'completed';
        showContinueButton = false;
      } else {
        statusText = 'Không đạt';
        statusClass = 'failed';
        showContinueButton = false;
      }
    } else {
      statusText = 'Có thể làm';
      statusClass = 'available';
      showContinueButton = false;
    }
    
    console.log(`\nUI Hiển thị:`);
    console.log(`- Trạng thái: "${statusText}" (${statusClass})`);
    console.log(`- Nút "Tiếp tục": ${showContinueButton ? 'HIỂN THỊ' : 'ẨN'}`);
    console.log(`- Điểm: ${topic.examStatus.score || 'Chưa có'}`);
    
    // Kiểm tra trạng thái mong đợi
    console.log('\n4. ĐÁNH GIÁ:');
    console.log('=============');
    
    if (topic.examStatus.taken && !topic.examStatus.inProgress) {
      if (topic.examStatus.passed) {
        console.log('✅ ĐÚNG: Bài thi đã hoàn thành và đạt -> "Hoàn thành", không hiển thị nút "Tiếp tục"');
      } else {
        console.log('✅ ĐÚNG: Bài thi đã hoàn thành nhưng không đạt -> "Không đạt", không hiển thị nút "Tiếp tục"');
      }
    } else if (topic.examStatus.inProgress) {
      console.log('⚠️  CẢNH BÁO: Vẫn có bài thi IN_PROGRESS - cần kiểm tra tại sao chưa chuyển thành SUBMITTED');
    } else {
      console.log('ℹ️  INFO: Chưa có bài thi nào được thực hiện');
    }
    
    console.log('\n=== TEST HOÀN THÀNH ===');
    
  } catch (error) {
    console.error('❌ Lỗi trong quá trình test:', error);
  }
}

// Chạy test
if (require.main === module) {
  testExamStatusLogic()
    .then(() => process.exit(0))
    .catch(error => {
      console.error('Test failed:', error);
      process.exit(1);
    });
}

module.exports = { testExamStatusLogic };
