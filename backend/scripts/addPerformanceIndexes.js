require('dotenv').config();
const DatabaseService = require('../src/services/DatabaseService');

async function addPerformanceIndexes() {
  try {
    console.log('Adding performance indexes...');
    
    const indexes = [
      // Exam-related indexes
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
    
    for (const indexQuery of indexes) {
      try {
        await DatabaseService.execute(indexQuery);
        console.log(`✅ ${indexQuery}`);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          console.log(`⚠️  Index already exists: ${indexQuery}`);
        } else {
          console.error(`❌ Failed: ${indexQuery}`, error.message);
        }
      }
    }
    
    console.log('Performance indexes setup completed!');
    
  } catch (error) {
    console.error('Error adding indexes:', error);
  } finally {
    process.exit(0);
  }
}

addPerformanceIndexes();
