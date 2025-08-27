const bcrypt = require('bcrypt');
const connection = require('../src/config/database');

async function seedUsers() {
  try {
    console.log('Starting to seed users...');

    // Hash passwords
    const adminPassword = await bcrypt.hash('admin123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);

    // Insert admin user
    const adminQuery = `
      INSERT INTO Users (username, password, role, email, full_name) 
      VALUES (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE password = VALUES(password)
    `;
    
    await connection.promise().execute(adminQuery, [
      'admin',
      adminPassword,
      'ADMIN',
      'admin@vmu.edu.vn',
      'Quản trị viên'
    ]);

    // Insert student user
    await connection.promise().execute(adminQuery, [
      'student001',
      studentPassword,
      'STUDENT',
      'student001@vmu.edu.vn',
      'Nguyễn Văn A'
    ]);

    // Insert another student
    await connection.promise().execute(adminQuery, [
      'student002',
      studentPassword,
      'STUDENT',
      'student002@vmu.edu.vn',
      'Trần Thị B'
    ]);

    console.log('✅ Users seeded successfully!');
    console.log('Admin: username=admin, password=admin123');
    console.log('Student: username=student001, password=student123');
    console.log('Student: username=student002, password=student123');

  } catch (error) {
    console.error('❌ Error seeding users:', error);
  } finally {
    process.exit(0);
  }
}

seedUsers();
