const DatabaseService = require('../src/services/DatabaseService');

async function seedTopics() {
  try {
    console.log('Starting to seed topics and schedules...');
    
    // 1. Create sample topics
    const topics = [
      {
        name: 'Tư tưởng Hồ Chí Minh',
        description: 'Chuyên đề về tư tưởng và đạo đức của Chủ tịch Hồ Chí Minh',
        duration_minutes: 30,
        pass_score: 70,
        question_count: 20
      },
      {
        name: 'Đường lối cách mạng của Đảng',
        description: 'Chuyên đề về đường lối cách mạng của Đảng Cộng sản Việt Nam',
        duration_minutes: 45,
        pass_score: 70,
        question_count: 25
      },
      {
        name: 'Lịch sử Đảng Cộng sản Việt Nam',
        description: 'Tổng quan về lịch sử hình thành và phát triển của Đảng',
        duration_minutes: 40,
        pass_score: 65,
        question_count: 22
      },
      {
        name: 'Pháp luật đại cương',
        description: 'Kiến thức cơ bản về pháp luật và hệ thống pháp luật Việt Nam',
        duration_minutes: 35,
        pass_score: 60,
        question_count: 18
      },
      {
        name: 'Quy chế học sinh, sinh viên',
        description: 'Các quy định về quyền và nghĩa vụ của sinh viên trong trường đại học',
        duration_minutes: 25,
        pass_score: 80,
        question_count: 15
      }
    ];

    console.log('Inserting topics...');
    // Insert topics into database
    for (const topic of topics) {
      const existingTopics = await DatabaseService.execute(
        'SELECT id FROM Topics WHERE name = ?',
        [topic.name]
      );
      
      if (existingTopics.length === 0) {
        await DatabaseService.execute(
          'INSERT INTO Topics (name, description, duration_minutes, pass_score, question_count) VALUES (?, ?, ?, ?, ?)',
          [topic.name, topic.description, topic.duration_minutes, topic.pass_score, topic.question_count]
        );
        console.log(`Topic '${topic.name}' created successfully`);
      } else {
        console.log(`Topic '${topic.name}' already exists, skipping`);
      }
    }
    
    // 2. Get all departments and topics to create schedules
    const departments = await DatabaseService.execute('SELECT id FROM Departments');
    const createdTopics = await DatabaseService.execute('SELECT id FROM Topics');
    
    if (!departments.length || !createdTopics.length) {
      console.log('No departments or topics found. Please create them first.');
      return;
    }
    
    console.log(`Found ${departments.length} departments and ${createdTopics.length} topics`);
    
    // 3. Create schedules for all departments (one topic per department)
    console.log('Creating schedules...');
    let scheduleCount = 0;
    
    for (const department of departments) {
      // Get majors for this department
      const majors = await DatabaseService.execute(
        'SELECT id FROM Majors WHERE department_id = ?',
        [department.id]
      );
      
      if (!majors.length) {
        console.log(`No majors found for department ID ${department.id}, creating department-level schedule`);
        
        // Assign all topics to this department (department-wide schedule)
        for (const topic of createdTopics) {
          // Check if schedule already exists
          const existingSchedule = await DatabaseService.execute(
            'SELECT id FROM Schedules WHERE department_id = ? AND topic_id = ? AND major_id IS NULL',
            [department.id, topic.id]
          );
          
          // Get current date and add 7 days for end date
          const startDate = new Date();
          const endDate = new Date();
          endDate.setDate(endDate.getDate() + 7);
          
          // Format dates for SQL
          const startSql = startDate.toISOString().slice(0, 19).replace('T', ' ');
          const endSql = endDate.toISOString().slice(0, 19).replace('T', ' ');
          
          if (existingSchedule.length === 0) {
            await DatabaseService.execute(
              'INSERT INTO Schedules (department_id, topic_id, start, end) VALUES (?, ?, ?, ?)',
              [department.id, topic.id, startSql, endSql]
            );
            scheduleCount++;
            console.log(`Schedule created for department ID ${department.id} and topic ID ${topic.id}`);
          } else {
            console.log(`Schedule already exists for department ID ${department.id} and topic ID ${topic.id}`);
          }
        }
      } else {
        console.log(`Found ${majors.length} majors for department ID ${department.id}`);
        
        // Create major-specific schedules
        for (const major of majors) {
          // Get some topics for this major
          for (let i = 0; i < createdTopics.length; i++) {
            const topic = createdTopics[i];
            
            // Check if schedule already exists for this major
            const existingMajorSchedule = await DatabaseService.execute(
              'SELECT id FROM Schedules WHERE major_id = ? AND topic_id = ?',
              [major.id, topic.id]
            );
            
            // Get current date and add 7 days for end date
            const startDate = new Date();
            const endDate = new Date();
            endDate.setDate(endDate.getDate() + 7);
            
            // Format dates for SQL
            const startSql = startDate.toISOString().slice(0, 19).replace('T', ' ');
            const endSql = endDate.toISOString().slice(0, 19).replace('T', ' ');
            
            if (existingMajorSchedule.length === 0) {
              await DatabaseService.execute(
                'INSERT INTO Schedules (department_id, major_id, topic_id, start, end) VALUES (?, ?, ?, ?, ?)',
                [department.id, major.id, topic.id, startSql, endSql]
              );
              scheduleCount++;
              console.log(`Schedule created for department ID ${department.id}, major ID ${major.id}, topic ID ${topic.id}`);
            } else {
              console.log(`Schedule already exists for major ID ${major.id} and topic ID ${topic.id}`);
            }
          }
        }
      }
    }
    
    console.log(`Seeding completed! Created ${scheduleCount} new schedules.`);
    
  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    // Close database connection if needed
    process.exit(0);
  }
}

// Run the seeding function
seedTopics();
