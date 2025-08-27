const DatabaseService = require('../src/services/DatabaseService');

async function seedQuestions() {
  try {
    console.log('Starting to seed questions...');
    
    // Get all topics
    const topics = await DatabaseService.execute('SELECT id, name FROM Topics');
    console.log(`Found ${topics.length} topics to add questions to`);
    
    if (!topics.length) {
      console.log('No topics found. Please run the seedTopics.js script first.');
      return;
    }

    // Sample questions for each topic
    for (const topic of topics) {
      console.log(`Adding questions for topic: ${topic.name}`);
      
      // Create 5 sample questions for each topic
      const questionCount = 5;
      for (let i = 1; i <= questionCount; i++) {
        // Insert the question
        const questionQuery = `
          INSERT INTO Questions (topic_id, content, is_multiple_choice) 
          VALUES (?, ?, ?)
        `;
        
        const questionContent = `Câu hỏi số ${i} cho chuyên đề ${topic.name}`;
        const isMultipleChoice = i % 2 === 0; // Alternate between single and multiple choice
        
        const result = await DatabaseService.execute(
          questionQuery, 
          [topic.id, questionContent, isMultipleChoice]
        );
        
        const questionId = result.insertId;
        console.log(`  Added question ${i} with ID ${questionId}`);
        
        // Create 4 answers for each question
        for (let j = 1; j <= 4; j++) {
          const isCorrect = j === 1; // First answer is correct
          const answerContent = `Đáp án ${j} cho câu hỏi ${i} của chuyên đề ${topic.name}`;
          
          await DatabaseService.execute(
            'INSERT INTO Answers (question_id, content, is_correct, is_active) VALUES (?, ?, ?, TRUE)',
            [questionId, answerContent, isCorrect]
          );
          
          console.log(`    Added answer ${j} for question ${i}`);
        }
      }
      
      // Update the question_count field in the Topics table
      await DatabaseService.execute(
        'UPDATE Topics SET question_count = ? WHERE id = ?',
        [questionCount, topic.id]
      );
      
      console.log(`Added ${questionCount} questions to topic "${topic.name}"`);
    }
    
    console.log('Questions seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding questions:', error);
    process.exit(1);
  }
}

// Run the seeding function
seedQuestions();
