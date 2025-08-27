require('dotenv').config();
const DatabaseService = require('../src/services/DatabaseService');

async function addIsActiveColumn() {
  try {
    console.log('Checking if is_active column exists in Answers table...');
    
    // Kiểm tra xem cột is_active đã tồn tại chưa
    const columns = await DatabaseService.execute(`
      SELECT COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'Answers' AND COLUMN_NAME = 'is_active'
    `, [process.env.DB_NAME]);
    
    if (columns.length > 0) {
      console.log('Column is_active already exists in Answers table.');
      return;
    }
    
    // Thêm cột is_active
    console.log('Adding is_active column to Answers table...');
    await DatabaseService.execute(`
      ALTER TABLE Answers 
      ADD COLUMN is_active BOOLEAN DEFAULT TRUE
    `);
    
    console.log('Successfully added is_active column to Answers table.');
    
    // Cập nhật tất cả record hiện tại thành active
    console.log('Setting all existing answers to active...');
    await DatabaseService.execute(`UPDATE Answers SET is_active = TRUE WHERE is_active IS NULL`);
    
    console.log('Migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
  } finally {
    process.exit(0);
  }
}

addIsActiveColumn();
