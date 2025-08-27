require('dotenv').config();
const DatabaseService = require('../src/services/DatabaseService');

async function cleanDuplicateExams() {
  try {
    console.log('🧹 Cleaning duplicate exams...');
    
    // 1. Tìm duplicates dựa trên student_id, topic_id, start_time, end_time
    const duplicates = await DatabaseService.execute(`
      SELECT student_id, topic_id, start_time, end_time, COUNT(*) as count, 
             GROUP_CONCAT(id ORDER BY id) as exam_ids
      FROM Exams 
      WHERE status = 'SUBMITTED'
      GROUP BY student_id, topic_id, start_time, end_time
      HAVING COUNT(*) > 1
      ORDER BY student_id, topic_id
    `);
    
    console.log(`Found ${duplicates.length} groups of duplicate exams:`);
    
    for (const dup of duplicates) {
      const examIds = dup.exam_ids.split(',');
      const keepId = examIds[0]; // Giữ exam đầu tiên
      const deleteIds = examIds.slice(1); // Xóa các exam còn lại
      
      console.log(`Student ${dup.student_id}, Topic ${dup.topic_id}: Keep exam ${keepId}, delete [${deleteIds.join(',')}]`);
      
      // Xóa ExamAnswers của các exam duplicate
      for (const deleteId of deleteIds) {
        await DatabaseService.execute('DELETE FROM ExamAnswers WHERE exam_id = ?', [deleteId]);
      }
      
      // Xóa các exam duplicate
      await DatabaseService.execute(`DELETE FROM Exams WHERE id IN (${deleteIds.join(',')})`);
    }
    
    // 2. Tìm best score cho mỗi student-topic combination
    const bestScores = await DatabaseService.execute(`
      SELECT student_id, topic_id, MAX(score) as best_score, 
             COUNT(*) as total_attempts
      FROM Exams 
      WHERE status = 'SUBMITTED'
      GROUP BY student_id, topic_id
      HAVING total_attempts > 1
    `);
    
    console.log(`\\nFound ${bestScores.length} student-topic combinations with multiple attempts:`);
    bestScores.forEach(bs => {
      console.log(`Student ${bs.student_id}, Topic ${bs.topic_id}: ${bs.total_attempts} attempts, best score: ${bs.best_score}%`);
    });
    
    // 3. Thống kê sau khi clean
    const finalStats = await DatabaseService.execute(`
      SELECT 
        COUNT(*) as total_exams,
        COUNT(DISTINCT student_id) as unique_students,
        COUNT(DISTINCT topic_id) as unique_topics,
        COUNT(DISTINCT CONCAT(student_id, '-', topic_id)) as unique_combinations
      FROM Exams 
      WHERE status = 'SUBMITTED'
    `);
    
    console.log('\\n📊 Final statistics after cleanup:');
    console.log(`Total exams: ${finalStats[0].total_exams}`);
    console.log(`Unique students: ${finalStats[0].unique_students}`);
    console.log(`Unique topics: ${finalStats[0].unique_topics}`);
    console.log(`Unique student-topic combinations: ${finalStats[0].unique_combinations}`);
    
    console.log('✅ Cleanup completed!');
    
  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  } finally {
    process.exit(0);
  }
}

cleanDuplicateExams();
