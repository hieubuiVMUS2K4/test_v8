// Database service utilities

const connection = require('../config/database');

class DatabaseService {
  // Execute a query with promise support
  static async query(sql, params = []) {
    return new Promise((resolve, reject) => {
      connection.query(sql, params, (error, results, fields) => {
        if (error) {
          console.error('Database Error:', error);
          reject(error);
        } else {
          resolve({ results, fields });
        }
      });
    });
  }

  // Execute a query and return only results
  static async execute(sql, params = []) {
    const { results } = await this.query(sql, params);
    return results;
  }

  // Get a single record
  static async findOne(sql, params = []) {
    const results = await this.execute(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  // Get multiple records with pagination
  static async findMany(sql, params = [], page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    const paginatedSql = `${sql} LIMIT ${limit} OFFSET ${offset}`;
    
    const results = await this.execute(paginatedSql, params);
    
    // Get total count for pagination
    const countSql = `SELECT COUNT(*) as total FROM (${sql}) as count_table`;
    const countResult = await this.findOne(countSql, params);
    const total = countResult ? countResult.total : 0;
    
    return {
      data: results,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Insert a record and return the inserted ID
  static async insert(table, data) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const placeholders = fields.map(() => '?').join(', ');
    
    const sql = `INSERT INTO ${table} (${fields.join(', ')}) VALUES (${placeholders})`;
    const results = await this.execute(sql, values);
    
    return results.insertId;
  }

  // Update records
  static async update(table, data, where, whereParams = []) {
    const fields = Object.keys(data);
    const values = Object.values(data);
    const setClause = fields.map(field => `${field} = ?`).join(', ');
    
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;
    const results = await this.execute(sql, [...values, ...whereParams]);
    
    return results.affectedRows;
  }

  // Delete records
  static async delete(table, where, whereParams = []) {
    const sql = `DELETE FROM ${table} WHERE ${where}`;
    const results = await this.execute(sql, whereParams);
    
    return results.affectedRows;
  }

  // Begin transaction
  static async beginTransaction() {
    return new Promise((resolve, reject) => {
      connection.beginTransaction((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // Commit transaction
  static async commit() {
    return new Promise((resolve, reject) => {
      connection.commit((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // Rollback transaction
  static async rollback() {
    return new Promise((resolve, reject) => {
      connection.rollback((error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  // Execute transaction
  static async transaction(callback) {
    try {
      await this.beginTransaction();
      const result = await callback();
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }

  // Check if table exists
  static async tableExists(tableName) {
    const sql = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = ? AND table_name = ?
    `;
    const result = await this.findOne(sql, [process.env.DB_NAME, tableName]);
    return result && result.count > 0;
  }

  // Get table structure
  static async getTableStructure(tableName) {
    const sql = `DESCRIBE ${tableName}`;
    return await this.execute(sql);
  }

  // Test database connection
  static async testConnection() {
    try {
      const result = await this.findOne('SELECT 1 as test');
      return result && result.test === 1;
    } catch (error) {
      console.error('Database connection test failed:', error);
      return false;
    }
  }
}

module.exports = DatabaseService;
