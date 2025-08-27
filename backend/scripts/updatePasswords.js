const bcrypt = require('bcrypt');
const connection = require('../src/config/database');

async function updatePasswords() {
  try {
    console.log('Updating passwords to bcrypt hash...');
    
    // Get all users with plain text passwords
    const [users] = await connection.promise().query('SELECT id, username, password FROM Users');
    
    for (const user of users) {
      // Check if password is already hashed (bcrypt hashes start with $2b$)
      if (!user.password.startsWith('$2b$')) {
        console.log(`Updating password for user: ${user.username}`);
        
        // Hash the plain text password
        const hashedPassword = await bcrypt.hash(user.password, 10);
        
        // Update in database
        await connection.promise().execute(
          'UPDATE Users SET password = ? WHERE id = ?',
          [hashedPassword, user.id]
        );
        
        console.log(`✅ Updated password for ${user.username}`);
      } else {
        console.log(`⚠️ Password for ${user.username} already hashed`);
      }
    }
    
    console.log('\n✅ All passwords updated successfully!');
    console.log('Test accounts:');
    console.log('admin1: username=admin1, password=123456');
    
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
  } finally {
    process.exit(0);
  }
}

updatePasswords();
