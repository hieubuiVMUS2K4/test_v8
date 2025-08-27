const ResponseHelper = require('../utils/ResponseHelper');
const DatabaseService = require('../services/DatabaseService');
const CacheService = require('../services/CacheService');

class ExamOptimizationService {
  
  /**
   * Tạo pool câu hỏi random với Redis cache
   */
  static async generateRandomQuestionPool(topicId, questionCount = null) {
    try {
      // Kiểm tra cache trước
  const cacheKey = `topic_questions_${topicId}_${questionCount || 'all'}`;
  // CacheService.getQuestionPool hiện nhận topicId như key logic đơn giản; ta chuyển sang dùng key thống nhất
  const cachedQuestions = await CacheService.getQuestionPool(cacheKey);
      
      if (cachedQuestions) {
        console.log(`Cache HIT: Using cached question pool for topic ${topicId}`);
        return cachedQuestions;
      }
      
      console.log(`Cache MISS: Generating new question pool for topic ${topicId}`);
      
      // Lấy question_count từ Topics để giới hạn nếu cần
      const topicMeta = await DatabaseService.execute('SELECT question_count FROM Topics WHERE id = ?', [topicId]);
      const configuredCount = topicMeta.length ? topicMeta[0].question_count : null;
      // Lấy tất cả ID câu hỏi của topic
      const allQuestionIds = await DatabaseService.execute(
        'SELECT id FROM Questions WHERE topic_id = ? ORDER BY id ASC',
        [topicId]
      );
      
      if (!allQuestionIds.length) return [];
      
      // Shuffle array bằng Fisher-Yates algorithm
      const shuffled = [...allQuestionIds];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      
      // Lấy số lượng câu hỏi cần thiết
  const limit = questionCount || configuredCount || null;
  const selectedIds = limit ? shuffled.slice(0, limit) : shuffled;
  console.log(`[ExamOptimization] topic ${topicId} totalQuestions=${allQuestionIds.length}, configured=${configuredCount}, requested=${questionCount}, used=${selectedIds.length}`);
      
      // Lấy full data câu hỏi theo thứ tự đã random
      const questionIdsString = selectedIds.map(q => q.id).join(',');
      const questionsQuery = `
        SELECT q.id, q.content as question, q.is_multiple_choice
        FROM Questions q
        WHERE q.id IN (${questionIdsString})
        ORDER BY FIELD(q.id, ${questionIdsString})
      `;
      
      const questions = await DatabaseService.execute(questionsQuery);
      
      // Cache kết quả với TTL 1 hour
  await CacheService.cacheQuestionPool(cacheKey, questions);
      
      return questions;
    } catch (error) {
      console.error('Error generating random question pool:', error);
      throw error;
    }
  }

  /**
   * Tạo hoặc load exam session hiện có
   */
  static async createExamSession(studentId, topicId, userId = null) {
    try {
      let existing = [];
      let useUserIdFallback = false;
      // Thử truy vấn với student_id
      try {
        existing = await DatabaseService.execute(
          'SELECT id, status FROM Exams WHERE student_id = ? AND topic_id = ? LIMIT 1',
          [studentId, topicId]
        );
      } catch (e) {
        if (e.message.includes('Unknown column') && userId) {
          useUserIdFallback = true;
        } else {
          throw e;
        }
      }
      // Nếu không có kết quả và có userId, thử với user_id (schema cũ)
      if ((!existing || existing.length === 0) && userId) {
        try {
          const alt = await DatabaseService.execute(
            'SELECT id, status FROM Exams WHERE user_id = ? AND topic_id = ? LIMIT 1',
            [userId, topicId]
          );
          if (alt && alt.length) {
            existing = alt;
            useUserIdFallback = true;
          }
        } catch (e2) {
          // ignore if alt also fails
        }
      }

      let examId;
      if (existing.length > 0) {
        examId = existing[0].id;
        const status = existing[0].status;
        console.log(`Found existing exam ${examId} status=${status} for student ${studentId}, topic ${topicId}`);
        
        // Chỉ reset exam nếu đã SUBMITTED (cho phép làm lại)
        // Nếu là IN_PROGRESS thì giữ nguyên để tiếp tục
        if (status === 'SUBMITTED') {
          console.log(`Resetting submitted exam ${examId} for retake`);
          try {
            await DatabaseService.execute(
              'UPDATE Exams SET start_time = NOW(), end_time = NULL, score = NULL, status = ? WHERE id = ?',
              ['IN_PROGRESS', examId]
            );
          } catch (e) {
            if (e.message.includes('Unknown column')) {
              await DatabaseService.execute(
                'UPDATE Exams SET start_time = NOW(), end_time = NULL, score = NULL WHERE id = ?',
                [examId]
              );
            } else throw e;
          }
          // Xóa đáp án cũ khi làm lại
          await DatabaseService.execute('DELETE FROM ExamAnswers WHERE exam_id = ?', [examId]);
        } else if (status === 'IN_PROGRESS') {
          console.log(`Continuing exam ${examId} in progress`);
          // Không xóa đáp án, để sinh viên tiếp tục
        } else {
          // Status khác (REVIEWED) - coi như làm lại
          console.log(`Resetting exam ${examId} with status ${status} for retake`);
          try {
            await DatabaseService.execute(
              'UPDATE Exams SET start_time = NOW(), end_time = NULL, score = NULL, status = ? WHERE id = ?',
              ['IN_PROGRESS', examId]
            );
          } catch (e) {
            if (e.message.includes('Unknown column')) {
              await DatabaseService.execute(
                'UPDATE Exams SET start_time = NOW(), end_time = NULL, score = NULL WHERE id = ?',
                [examId]
              );
            } else throw e;
          }
          await DatabaseService.execute('DELETE FROM ExamAnswers WHERE exam_id = ?', [examId]);
        }
      } else {
        console.log(`Creating new exam session for student ${studentId}, topic ${topicId}`);
        let examResult;
        try {
          if (!useUserIdFallback) {
            examResult = await DatabaseService.execute(
              'INSERT INTO Exams (student_id, topic_id, start_time, status) VALUES (?, ?, NOW(), ?)',
              [studentId, topicId, 'IN_PROGRESS']
            );
          } else {
            // Fallback schema với user_id
            examResult = await DatabaseService.execute(
              'INSERT INTO Exams (user_id, topic_id, start_time, status) VALUES (?, ?, NOW(), ?)',
              [userId, topicId, 'IN_PROGRESS']
            );
          }
        } catch (e) {
          if (e.message.includes('Unknown column') || e.message.includes('status')) {
            // Thử insert không có status
            if (!useUserIdFallback) {
              examResult = await DatabaseService.execute(
                'INSERT INTO Exams (student_id, topic_id, start_time) VALUES (?, ?, NOW())',
                [studentId, topicId]
              );
            } else {
              examResult = await DatabaseService.execute(
                'INSERT INTO Exams (user_id, topic_id, start_time) VALUES (?, ?, NOW())',
                [userId, topicId]
              );
            }
          } else throw e;
        }
        examId = examResult.insertId;
      }
      
      // Generate random questions
      // Lấy giới hạn từ topic.question_count để tránh mặc định 40 cứng
      let limit = null;
      try {
        const meta = await DatabaseService.execute('SELECT question_count FROM Topics WHERE id = ?', [topicId]);
        if (meta.length && meta[0].question_count) {
          limit = meta[0].question_count;
        }
      } catch (e) {
        console.warn('Could not fetch topic question_count, fallback to all questions:', e.message);
      }
      const questions = await this.generateRandomQuestionPool(topicId, limit);
      
      // Pre-insert ExamAnswers với is_selected = FALSE
      for (const question of questions) {
        const answers = await DatabaseService.execute(
          'SELECT id FROM Answers WHERE question_id = ? AND (is_active IS NULL OR is_active = TRUE)',
          [question.id]
        );
        
        for (const answer of answers) {
          await DatabaseService.execute(
            'INSERT INTO ExamAnswers (exam_id, question_id, answer_id, is_selected) VALUES (?, ?, ?, FALSE)',
            [examId, question.id, answer.id]
          );
        }
      }
      
      return { examId, questions };
    } catch (error) {
      console.error('Error creating exam session:', error);
      throw error;
    }
  }

  /**
   * Batch update câu trả lời thay vì update từng câu một
   */
  static async batchUpdateAnswers(examId, answerUpdates) {
    try {
      // Build batch update query
      const cases = [];
      const questionIds = [];
      const answerIds = [];
      
      for (const update of answerUpdates) {
        cases.push(`WHEN question_id = ${update.questionId} AND answer_id = ${update.answerId} THEN ${update.isSelected ? 1 : 0}`);
        questionIds.push(update.questionId);
        answerIds.push(update.answerId);
      }
      
      if (cases.length === 0) return;
      
      const updateQuery = `
        UPDATE ExamAnswers 
        SET is_selected = CASE 
          ${cases.join(' ')}
          ELSE is_selected 
        END
        WHERE exam_id = ? 
        AND (question_id, answer_id) IN (${answerUpdates.map(() => '(?,?)').join(',')})
      `;
      
      const params = [examId];
      for (const update of answerUpdates) {
        params.push(update.questionId, update.answerId);
      }
      
      await DatabaseService.execute(updateQuery, params);
      
    } catch (error) {
      console.error('Error batch updating answers:', error);
      throw error;
    }
  }
}

module.exports = ExamOptimizationService;
