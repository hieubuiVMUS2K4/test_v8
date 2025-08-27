require('dotenv').config();
const DatabaseService = require('../src/services/DatabaseService');

async function testReportLogic() {
  try {
    console.log('🧪 Testing report logic...\n');
    
    // 1. Kiểm tra raw data từ student ID 6 (từ data bạn cung cấp)
    console.log('📊 Raw data for Student ID 6:');
    const studentExams = await DatabaseService.execute(`
      SELECT e.id, e.topic_id, e.score, e.status, t.name as topic_name
      FROM Exams e 
      JOIN Topics t ON e.topic_id = t.id
      WHERE e.student_id = 6 AND e.status = 'SUBMITTED'
      ORDER BY e.topic_id, e.score DESC
    `);
    
    // Group by topic to find best scores
    const topicScores = {};
    studentExams.forEach(exam => {
      if (!topicScores[exam.topic_id]) {
        topicScores[exam.topic_id] = {
          topic_name: exam.topic_name,
          best_score: exam.score,
          attempts: 0
        };
      }
      topicScores[exam.topic_id].attempts++;
      if (exam.score > topicScores[exam.topic_id].best_score) {
        topicScores[exam.topic_id].best_score = exam.score;
      }
    });
    
    console.log('Best scores per topic:');
    Object.keys(topicScores).forEach(topicId => {
      const topic = topicScores[topicId];
      const passed = topic.best_score >= 80 ? '✅ PASSED' : '❌ FAILED';
      console.log(`- Topic ${topicId} (${topic.topic_name}): ${topic.best_score}% (${topic.attempts} attempts) ${passed}`);
    });
    
    // 2. Test new logic
    console.log('\n🔍 Testing new report logic:');
    
    // Overview statistics
    const overviewTest = await DatabaseService.execute(`
      SELECT 
        (SELECT COUNT(DISTINCT s.id) FROM Students s) as total_students,
        (SELECT COUNT(DISTINCT s.id) FROM Students s WHERE EXISTS (
          SELECT 1 FROM Exams e WHERE e.student_id = s.id AND e.status = 'SUBMITTED'
        )) as students_with_exams,
        (SELECT COUNT(DISTINCT s.id) FROM Students s WHERE EXISTS (
          SELECT 1 FROM Exams e WHERE e.student_id = s.id AND e.status = 'SUBMITTED'
          GROUP BY e.topic_id HAVING MAX(e.score) >= 80
        )) as passed_students
    `);
    
    console.log('Overview Statistics:');
    console.log(`- Total students: ${overviewTest[0].total_students}`);
    console.log(`- Students with exams: ${overviewTest[0].students_with_exams}`);
    console.log(`- Students passed: ${overviewTest[0].passed_students}`);
    
    // 3. Check if student 6 should be counted as passed
    const student6Check = await DatabaseService.execute(`
      SELECT COUNT(*) as passed_topics
      FROM (
        SELECT e.topic_id, MAX(e.score) as best_score
        FROM Exams e 
        WHERE e.student_id = 6 AND e.status = 'SUBMITTED'
        GROUP BY e.topic_id 
        HAVING MAX(e.score) >= 80
      ) as passed_topics_subquery
    `);
    
    console.log(`\n👤 Student 6 analysis:`);
    console.log(`- Topics with score >= 80%: ${student6Check[0].passed_topics}`);
    console.log(`- Should be counted as PASSED: ${student6Check[0].passed_topics > 0 ? 'YES ✅' : 'NO ❌'}`);
    
    // 4. Detailed breakdown by topic
    console.log('\n📈 All students performance by topic:');
    const topicBreakdown = await DatabaseService.execute(`
      SELECT 
        t.id,
        t.name,
        COUNT(DISTINCT e.student_id) as students_attempted,
        COUNT(DISTINCT CASE WHEN best_scores.best_score >= 80 THEN e.student_id END) as students_passed
      FROM Topics t
      LEFT JOIN Exams e ON t.id = e.topic_id AND e.status = 'SUBMITTED'
      LEFT JOIN (
        SELECT student_id, topic_id, MAX(score) as best_score
        FROM Exams 
        WHERE status = 'SUBMITTED'
        GROUP BY student_id, topic_id
      ) best_scores ON e.student_id = best_scores.student_id AND e.topic_id = best_scores.topic_id
      GROUP BY t.id, t.name
      ORDER BY t.id
    `);
    
    topicBreakdown.forEach(topic => {
      const passRate = topic.students_attempted > 0 ? 
        Math.round((topic.students_passed / topic.students_attempted) * 100) : 0;
      console.log(`- Topic ${topic.id} (${topic.name}): ${topic.students_passed}/${topic.students_attempted} passed (${passRate}%)`);
    });
    
    console.log('\n✅ Report logic test completed!');
    
  } catch (error) {
    console.error('❌ Error during test:', error);
  } finally {
    process.exit(0);
  }
}

testReportLogic();
