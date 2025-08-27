const bcrypt = require('bcrypt');
const connection = require('../src/config/database');

async function testDatabase() {
  try {
    console.log('Testing database connection...');
    
    // Test connection
    await connection.promise().query('SELECT 1');
    console.log('✅ Database connected successfully');
    
    // Check if Users table exists
    const [tables] = await connection.promise().query("SHOW TABLES LIKE 'Users'");
    if (tables.length === 0) {
      console.log('❌ Users table does not exist');
      return;
    }
    console.log('✅ Users table exists');
    
    // Check existing users
    const [users] = await connection.promise().query('SELECT username, role FROM Users');
    console.log('Existing users:', users);
    
    // Create test users if they don't exist
    const adminPassword = await bcrypt.hash('admin123', 10);
    const studentPassword = await bcrypt.hash('student123', 10);
    
    // Insert admin
    try {
      await connection.promise().execute(
        'INSERT INTO Users (username, password, role, email, full_name) VALUES (?, ?, ?, ?, ?)',
        ['admin', adminPassword, 'ADMIN', 'admin@vmu.edu.vn', 'Quản trị viên']
      );
      console.log('✅ Admin user created');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('⚠️ Admin user already exists');
      } else {
        console.error('❌ Error creating admin:', err.message);
      }
    }
    
    // Insert student
    try {
      await connection.promise().execute(
        'INSERT INTO Users (username, password, role, email, full_name) VALUES (?, ?, ?, ?, ?)',
        ['student', studentPassword, 'STUDENT', 'student@vmu.edu.vn', 'Sinh viên test']
      );
      console.log('✅ Student user created');
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        console.log('⚠️ Student user already exists');
      } else {
        console.error('❌ Error creating student:', err.message);
      }
    }
    
    // Test password comparison
    const testUser = await connection.promise().query('SELECT * FROM Users WHERE username = ?', ['admin']);
    if (testUser[0].length > 0) {
      const user = testUser[0][0];
      const isValid = await bcrypt.compare('admin123', user.password);
      console.log('Password test for admin:', isValid ? '✅ Valid' : '❌ Invalid');
    }
    
    console.log('\nTest accounts:');
    console.log('Admin: username=admin, password=admin123');
    console.log('Student: username=student, password=student123');
    
  } catch (error) {
    console.error('❌ Database error:', error);
  } finally {
    process.exit(0);
  }
}

testDatabase();
