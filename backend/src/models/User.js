const connection = require('../config/database');

class User {
  static async findByUsername(username) {
    try {
      const [rows] = await connection.promise().query(
        "SELECT * FROM Users WHERE username = ?", 
        [username]
      );
      console.log('Database query result:', rows[0]); // Debug log
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async findById(id) {
    try {
      const [rows] = await connection.promise().query(
        "SELECT * FROM Users WHERE id = ?", 
        [id]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    try {
      const [rows] = await connection.promise().query(
        "SELECT * FROM Users WHERE email = ?", 
        [email]
      );
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async updateLastLogin(id) {
    try {
      // Vì bảng không có cột last_login, ta bỏ qua function này
      // Hoặc có thể thêm cột last_login vào database nếu cần
      console.log(`User ${id} logged in successfully`);
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getAllUsers() {
    try {
      const [rows] = await connection.promise().query(
        "SELECT id, username, email, full_name, role FROM Users"
      );
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

module.exports = User;