// Test logic báo cáo NGHIÊM NGẶT: làm TẤT CẢ chuyên đề và MỖI CHUYÊN ĐỀ >= 80%
const DatabaseService = require('../src/services/DatabaseService');

async function testReportLogicStrict() {
  try {
    console.log('=== KIỂM TRA LOGIC BÁO CÁO NGHIÊM NGẶT ===\n');

    // 1. Lấy tổng số chuyên đề
    const totalTopicsResult = await DatabaseService.execute(
      'SELECT COUNT(*) as total FROM Topics'
    );
    const totalTopics = totalTopicsResult[0].total;
    console.log(`Tổng số chuyên đề trong hệ thống: ${totalTopics}\n`);

    // 2. Kiểm tra student ID 6 chi tiết
    console.log('=== KIỂM TRA STUDENT ID 6 ===');
    
    // Lấy thông tin sinh viên
    const studentInfo = await DatabaseService.execute(`
      SELECT s.id, s.name, c.name as class_name, m.name as major_name, m.id as major_id
      FROM Students s
      JOIN Classes c ON s.class_id = c.id
      JOIN Majors m ON c.major_id = m.id
      WHERE s.id = 6
    `);
    
    if (studentInfo.length > 0) {
      const student = studentInfo[0];
      console.log(`Student: ${student.name}`);
      console.log(`Lớp: ${student.class_name}`);
      console.log(`Ngành: ${student.major_name} (ID: ${student.major_id})`);
      
      // Lấy điểm cao nhất mỗi chuyên đề
      const scores = await DatabaseService.execute(`
        SELECT 
          topic_id,
          MAX(score) as best_score,
          COUNT(*) as attempts
        FROM Exams 
        WHERE student_id = 6 AND status = 'SUBMITTED'
        GROUP BY topic_id
        ORDER BY topic_id
      `);
      
      console.log('\n--- ĐIỂM SỐ TỪNG CHUYÊN ĐỀ ---');
      let allTopicsCompleted = scores.length === totalTopics;
      let allScoresAbove80 = true;
      
      scores.forEach(score => {
        const passed = score.best_score >= 80;
        const status = passed ? '✓ ĐẠT' : '✗ KHÔNG ĐẠT';
        console.log(`Chuyên đề ${score.topic_id}: ${score.best_score}% (${score.attempts} lần) ${status}`);
        if (!passed) allScoresAbove80 = false;
      });
      
      console.log('\n--- ĐÁNH GIÁ TỔNG QUAN ---');
      console.log(`Số chuyên đề đã làm: ${scores.length}/${totalTopics} ${allTopicsCompleted ? '✓' : '✗'}`);
      console.log(`Tất cả chuyên đề >= 80%: ${allScoresAbove80 ? 'CÓ ✓' : 'KHÔNG ✗'}`);
      
      const finalResult = allTopicsCompleted && allScoresAbove80;
      console.log(`\n🎯 KẾT QUẢ CUỐI CÙNG: ${finalResult ? 'ĐẠT ✓' : 'KHÔNG ĐẠT ✗'}`);
      
      // 3. Test query báo cáo với logic nghiêm ngặt
      console.log('\n=== TEST QUERY BÁO CÁO NGHIÊM NGẶT ===');
      
      const strictQuery = `
        SELECT COUNT(DISTINCT s.id) as passed_students
        FROM Students s
        JOIN Classes c ON s.class_id = c.id
        JOIN Majors m ON c.major_id = m.id
        WHERE m.id = ?
        AND s.id IN (
          -- Sinh viên phải làm đủ TẤT CẢ chuyên đề
          SELECT e1.student_id 
          FROM Exams e1 
          WHERE e1.status = 'SUBMITTED'
          GROUP BY e1.student_id
          HAVING COUNT(DISTINCT e1.topic_id) = ?
        )
        AND s.id NOT IN (
          -- Loại trừ sinh viên có BẤT KỲ chuyên đề nào < 80%
          SELECT DISTINCT e2.student_id
          FROM Exams e2
          WHERE e2.status = 'SUBMITTED'
          GROUP BY e2.student_id, e2.topic_id
          HAVING MAX(e2.score) < 80
        )
      `;
      
      const queryResult = await DatabaseService.execute(strictQuery, [
        student.major_id, totalTopics
      ]);
      
      console.log(`Số sinh viên đạt theo query mới: ${queryResult[0].passed_students}`);
      
      // 4. Kiểm tra cụ thể student 6
      const checkStudent6 = await DatabaseService.execute(`
        SELECT 'PASSED' as status
        FROM Students s
        JOIN Classes c ON s.class_id = c.id
        JOIN Majors m ON c.major_id = m.id
        WHERE s.id = 6 AND m.id = ?
        AND s.id IN (
          SELECT e1.student_id 
          FROM Exams e1 
          WHERE e1.status = 'SUBMITTED'
          GROUP BY e1.student_id
          HAVING COUNT(DISTINCT e1.topic_id) = ?
        )
        AND s.id NOT IN (
          SELECT DISTINCT e2.student_id
          FROM Exams e2
          WHERE e2.status = 'SUBMITTED'
          GROUP BY e2.student_id, e2.topic_id
          HAVING MAX(e2.score) < 80
        )
      `, [student.major_id, totalTopics]);
      
      console.log(`Student 6 được tính trong báo cáo: ${checkStudent6.length > 0 ? 'CÓ ✓' : 'KHÔNG ✗'}`);
      
      // 5. Kiểm tra tại sao không đạt (nếu có)
      if (checkStudent6.length === 0) {
        console.log('\n--- PHÂN TÍCH TẠI SAO KHÔNG ĐẠT ---');
        
        // Kiểm tra điều kiện 1: Làm đủ tất cả chuyên đề
        const completionCheck = await DatabaseService.execute(`
          SELECT COUNT(DISTINCT topic_id) as completed_topics
          FROM Exams 
          WHERE student_id = 6 AND status = 'SUBMITTED'
        `);
        
        const isComplete = completionCheck[0].completed_topics === totalTopics;
        console.log(`Điều kiện 1 - Làm đủ ${totalTopics} chuyên đề: ${isComplete ? 'ĐẠT ✓' : `KHÔNG ĐẠT ✗ (chỉ làm ${completionCheck[0].completed_topics})`}`);
        
        // Kiểm tra điều kiện 2: Tất cả >= 80%
        const failedTopics = await DatabaseService.execute(`
          SELECT topic_id, MAX(score) as best_score
          FROM Exams 
          WHERE student_id = 6 AND status = 'SUBMITTED'
          GROUP BY topic_id
          HAVING MAX(score) < 80
        `);
        
        if (failedTopics.length > 0) {
          console.log(`Điều kiện 2 - Tất cả chuyên đề >= 80%: KHÔNG ĐẠT ✗`);
          console.log('Các chuyên đề chưa đạt:');
          failedTopics.forEach(topic => {
            console.log(`  - Chuyên đề ${topic.topic_id}: ${topic.best_score}%`);
          });
        } else {
          console.log(`Điều kiện 2 - Tất cả chuyên đề >= 80%: ĐẠT ✓`);
        }
      }
    }

  } catch (error) {
    console.error('Lỗi khi test logic báo cáo:', error);
  } finally {
    process.exit(0);
  }
}

testReportLogicStrict();
