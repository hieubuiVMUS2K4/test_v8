// Test thống kê sinh viên mới
const DatabaseService = require('../src/services/DatabaseService');

async function testStudentStatistics() {
  try {
    console.log('=== KIỂM TRA THỐNG KÊ SINH VIÊN MỚI ===\n');

    // 1. Tổng sinh viên
    const totalStudents = await DatabaseService.execute('SELECT COUNT(*) as total FROM Students');
    console.log(`Tổng sinh viên: ${totalStudents[0].total}`);

    // 2. Sinh viên đã tham gia thi
    const studentsWithExams = await DatabaseService.execute(`
      SELECT COUNT(DISTINCT student_id) as count 
      FROM Exams 
      WHERE status = 'SUBMITTED'
    `);
    console.log(`Sinh viên tham gia: ${studentsWithExams[0].count}`);

    // 3. Tổng số chuyên đề
    const totalTopics = await DatabaseService.execute('SELECT COUNT(*) as total FROM Topics');
    console.log(`Tổng chuyên đề: ${totalTopics[0].total}`);

    // 4. Sinh viên đạt (làm TẤT CẢ chuyên đề, MỖI CHUYÊN ĐỀ >= 80%)
    const passedStudents = await DatabaseService.execute(`
      SELECT COUNT(DISTINCT s.id) as passed_students
      FROM Students s
      WHERE s.id IN (
        -- Sinh viên phải có tổng số chuyên đề đã làm = tổng số chuyên đề có trong hệ thống
        SELECT e1.student_id 
        FROM Exams e1 
        WHERE e1.status = 'SUBMITTED'
        GROUP BY e1.student_id
        HAVING COUNT(DISTINCT e1.topic_id) = ?
      )
      AND s.id NOT IN (
        -- Loại trừ sinh viên có bất kỳ chuyên đề nào < 80%
        SELECT DISTINCT e2.student_id
        FROM Exams e2
        WHERE e2.status = 'SUBMITTED'
        GROUP BY e2.student_id, e2.topic_id
        HAVING MAX(e2.score) < 80
      )
    `, [totalTopics[0].total]);

    const passed = passedStudents[0].passed_students;
    const participated = studentsWithExams[0].count;
    const failed = participated - passed;
    const passRate = participated > 0 ? Math.round((passed / participated) * 100) : 0;

    console.log(`\n=== KẾT QUẢ THỐNG KÊ ===`);
    console.log(`Tổng sinh viên tham gia: ${participated}`);
    console.log(`Số sinh viên đạt: ${passed}`);
    console.log(`Số sinh viên không đạt: ${failed}`);
    console.log(`Tỷ lệ đạt: ${passRate}%`);

    // 5. Chi tiết sinh viên đạt
    console.log(`\n=== CHI TIẾT SINH VIÊN ĐẠT ===`);
    const passedStudentDetails = await DatabaseService.execute(`
      SELECT DISTINCT s.id, s.name
      FROM Students s
      WHERE s.id IN (
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
    `, [totalTopics[0].total]);

    if (passedStudentDetails.length > 0) {
      passedStudentDetails.forEach(student => {
        console.log(`- Student ${student.id}: ${student.name}`);
      });
    } else {
      console.log('Không có sinh viên nào đạt yêu cầu');
    }

  } catch (error) {
    console.error('Lỗi khi test thống kê:', error);
  } finally {
    process.exit(0);
  }
}

testStudentStatistics();
