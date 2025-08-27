const connection = require('../config/database');

class Exam {
  static async create(studentId, topicId) {
    try {
      const [result] = await connection.promise().query(
        "INSERT INTO Exams (student_id, topic_id, start_time, status) VALUES (?, ?, NOW(), 'IN_PROGRESS')",
        [studentId, topicId]
      );
      return result.insertId;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getById(id) {
    try {
      const [rows] = await connection.promise().query(`
        SELECT e.*, t.name as topic_name, t.description as topic_description,
               s.student_code, u.full_name as student_name
        FROM Exams e
        JOIN Topics t ON e.topic_id = t.id
        JOIN Students s ON e.student_id = s.id
        JOIN Users u ON s.user_id = u.id
        WHERE e.id = ?
      `, [id]);
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getByStudentAndTopic(studentId, topicId) {
    try {
      const [rows] = await connection.promise().query(`
        SELECT e.*, t.name as topic_name
        FROM Exams e
        JOIN Topics t ON e.topic_id = t.id
        WHERE e.student_id = ? AND e.topic_id = ?
        ORDER BY e.start_time DESC
        LIMIT 1
      `, [studentId, topicId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getByStudentId(studentId) {
    try {
      const [rows] = await connection.promise().query(`
        SELECT e.*, t.name as topic_name, t.description as topic_description
        FROM Exams e
        JOIN Topics t ON e.topic_id = t.id
        WHERE e.student_id = ?
        ORDER BY e.start_time DESC
      `, [studentId]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async submitExam(examId, answers, score) {
    const conn = await connection.promise();
    
    try {
      await conn.beginTransaction();

      // Cập nhật exam
      await conn.query(
        "UPDATE Exams SET end_time = NOW(), score = ?, status = 'SUBMITTED' WHERE id = ?",
        [score, examId]
      );

      // Xóa câu trả lời cũ nếu có
      await conn.query("DELETE FROM ExamAnswers WHERE exam_id = ?", [examId]);

      // Lưu câu trả lời mới
      for (const answer of answers) {
        await conn.query(
          "INSERT INTO ExamAnswers (exam_id, question_id, answer_id, is_selected) VALUES (?, ?, ?, ?)",
          [examId, answer.questionId, answer.answerId, true]
        );
      }

      await conn.commit();
      return true;
    } catch (error) {
      await conn.rollback();
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getExamAnswers(examId) {
    try {
      const [rows] = await connection.promise().query(`
        SELECT ea.*, q.content as question_content, a.content as answer_content, a.is_correct
        FROM ExamAnswers ea
        JOIN Questions q ON ea.question_id = q.id
        JOIN Answers a ON ea.answer_id = a.id
        WHERE ea.exam_id = ? AND ea.is_selected = true
      `, [examId]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getAllExams() {
    try {
      const [rows] = await connection.promise().query(`
        SELECT e.*, t.name as topic_name, s.student_code, u.full_name as student_name
        FROM Exams e
        JOIN Topics t ON e.topic_id = t.id
        JOIN Students s ON e.student_id = s.id
        JOIN Users u ON s.user_id = u.id
        ORDER BY e.start_time DESC
      `);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

module.exports = Exam;
