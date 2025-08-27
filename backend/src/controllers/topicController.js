const ResponseHelper = require('../utils/ResponseHelper');
const CacheService = require('../services/CacheService');

class TopicController {
  // Lấy danh sách tất cả topics
  static async getTopics(req, res) {
    try {
      const DatabaseService = require('../services/DatabaseService');
      // Lấy danh sách chuyên đề
      const query = `
        SELECT 
          t.id,
          t.name,
          t.description,
          t.duration_minutes,
          t.pass_score
        FROM Topics t
        ORDER BY t.id ASC
      `;
      const topics = await DatabaseService.execute(query);
      // Đếm lại số lượng câu hỏi cho từng chuyên đề
      for (const topic of topics) {
        const countRows = await DatabaseService.execute('SELECT COUNT(*) as count FROM Questions WHERE topic_id = ?', [topic.id]);
        topic.totalQuestions = countRows[0]?.count ?? 0;
      }
      return ResponseHelper.success(res, {
        topics,
        total: topics.length
      }, 'Lấy danh sách chuyên đề thành công');
    } catch (error) {
      console.error('Get topics error:', error);
      return ResponseHelper.error(res, 'Lỗi server khi lấy danh sách chuyên đề', 500);
    }
  }

  // Lấy thông tin chi tiết một topic
  static async getTopicById(req, res) {
    try {
      const { id } = req.params;
      const DatabaseService = require('../services/DatabaseService');
      const query = `
        SELECT 
          t.id,
          t.name,
          t.description,
          t.duration_minutes,
          t.pass_score,
          t.question_count as totalQuestions
        FROM Topics t
        WHERE t.id = ?
        LIMIT 1
      `;
      const rows = await DatabaseService.execute(query, [id]);
      if (!rows.length) {
        return ResponseHelper.error(res, 'Không tìm thấy chuyên đề', 404);
      }
      return ResponseHelper.success(res, {
        topic: rows[0]
      }, 'Lấy thông tin chuyên đề thành công');
    } catch (error) {
      console.error('Get topic by ID error:', error);
      return ResponseHelper.error(res, 'Lỗi server khi lấy thông tin chuyên đề', 500);
    }
  }

  // Lấy câu hỏi của một topic
  static async getTopicQuestions(req, res) {
    try {
      const { id } = req.params;
      const DatabaseService = require('../services/DatabaseService');
      // Lấy danh sách câu hỏi của chuyên đề
      const query = `
        SELECT 
          q.id,
          q.content as question,
          q.is_multiple_choice as type
        FROM Questions q
        WHERE q.topic_id = ?
        ORDER BY q.id ASC
      `;
      const questions = await DatabaseService.execute(query, [id]);
      // Lấy đáp án cho từng câu hỏi (chỉ lấy đáp án active)
      for (const question of questions) {
        const answersQuery = `SELECT id, content, is_correct FROM Answers WHERE question_id = ? AND (is_active IS NULL OR is_active = TRUE)`;
        const answers = await DatabaseService.execute(answersQuery, [question.id]);
        question.options = answers.map((ans, idx) => ({
          id: String.fromCharCode(65 + idx),
          text: ans.content,
          isCorrect: !!ans.is_correct
        }));
        question.correctAnswer = question.options.find(opt => opt.isCorrect)?.id || null;
        question.type = question.type ? 'multiple_choice' : 'single_choice';
      }
      return ResponseHelper.success(res, {
        questions,
        total: questions.length
      }, 'Lấy câu hỏi thành công');
    } catch (error) {
      console.error('Get topic questions error:', error);
      return ResponseHelper.error(res, 'Lỗi server khi lấy câu hỏi', 500);
    }
  }

  // Thêm hàm cập nhật chuyên đề
  static async updateTopic(req, res) {
    try {
      const { id } = req.params;
      const { name, description, duration_minutes, pass_score } = req.body;
      if (!name) {
        return ResponseHelper.error(res, 'Tên chuyên đề là bắt buộc', 400);
      }
      const DatabaseService = require('../services/DatabaseService');
      // Cập nhật chuyên đề
      const updateQuery = `UPDATE Topics SET name = ?, description = ?, duration_minutes = ?, pass_score = ? WHERE id = ?`;
      await DatabaseService.execute(updateQuery, [name, description, duration_minutes || 0, pass_score || 0, id]);
      // Lấy lại chuyên đề vừa cập nhật
      const selectQuery = `SELECT * FROM Topics WHERE id = ?`;
      const rows = await DatabaseService.execute(selectQuery, [id]);
      if (!rows.length) {
        return ResponseHelper.error(res, 'Không tìm thấy chuyên đề', 404);
      }
      return ResponseHelper.success(res, rows[0], 'Cập nhật chuyên đề thành công');
    } catch (error) {
      console.error('Update topic error:', error);
      return ResponseHelper.error(res, 'Lỗi server khi cập nhật chuyên đề', 500);
    }
  }

    // Thêm hàm importQuestions vào TopicController để xử lý import câu hỏi từ file Excel.
  static async importQuestions(req, res) {
    try {
      const { id } = req.params;
      
      console.log('-------------------');
      console.log('IMPORT QUESTIONS REQUEST');
      console.log('Topic ID:', id);
      console.log('Request body:', JSON.stringify(req.body, null, 2));
      
      // Check if request body is valid
      if (!req.body || typeof req.body !== 'object') {
        console.error('Invalid request body format');
        return ResponseHelper.error(res, 'Dữ liệu yêu cầu không hợp lệ', 400);
      }
      
      const { questions } = req.body;
      
      console.log('Questions extracted from request:', questions ? questions.length : 'none');
      
      if (!questions || !Array.isArray(questions)) {
        console.error('Invalid questions data format - questions must be an array');
        return ResponseHelper.error(res, 'Dữ liệu câu hỏi không hợp lệ, phải là mảng các câu hỏi', 400);
      }
      
      if (questions.length === 0) {
        console.error('Empty questions array');
        return ResponseHelper.error(res, 'Không có câu hỏi nào để import', 400);
      }
      
      // Kiểm tra xem topic có tồn tại không
      const DatabaseService = require('../services/DatabaseService');
      const topicExists = await DatabaseService.execute('SELECT id FROM Topics WHERE id = ?', [id]);
      if (!topicExists.length) {
        return ResponseHelper.error(res, 'Không tìm thấy chuyên đề', 404);
      }
      
      let inserted = 0;
      // Thêm từng câu hỏi vào database
      for (const q of questions) {
        if (!q.question) {
          console.warn('Skipping question with no content');
          continue;
        }
        
        console.log('Processing question:', q.question);
        console.log('Options:', JSON.stringify(q.options));
        
        // Kiểm tra định dạng câu hỏi
        if (!q.options || !Array.isArray(q.options)) {
          console.warn('Question has no options or options is not an array:', q.question);
          continue;
        }
        
        if (q.options.length < 2) {
          console.warn('Question has less than 2 options:', q.question);
          continue;
        }
        
        // Kiểm tra và sửa các đáp án để đảm bảo định dạng đúng
        if (q.options && Array.isArray(q.options)) {
          // Clean up options
          q.options = q.options.filter(opt => {
            return opt && typeof opt === 'object' && opt.text && opt.text.trim() !== '';
          });
          
          // Make sure options have proper structure
          q.options = q.options.map(opt => {
            return {
              text: String(opt.text || '').trim(),
              isCorrect: !!opt.isCorrect
            };
          });
          
          // Check if there's at least one correct answer
          let hasCorrectAnswer = q.options.some(opt => opt.isCorrect);
          
          // If no correct answer, mark the first one as correct
          if (!hasCorrectAnswer && q.options.length > 0) {
            console.log(`No correct answer for "${q.question}". Setting first option as correct.`);
            q.options[0].isCorrect = true;
          }
        }
        
        // Validate we have at least 2 valid options
        if (!q.options || !Array.isArray(q.options) || q.options.length < 2) {
          console.warn(`Question "${q.question}" has fewer than 2 valid options. Skipping.`);
          continue;
        }
        
        try {
          // Thêm câu hỏi vào database
          const isMultipleChoice = q.type === 'multiple_choice';
          
          console.log(`--- INSERTING QUESTION ---`);
          console.log(`Content: "${q.question}"`);
          console.log(`Type: ${isMultipleChoice ? 'multiple_choice' : 'single_choice'}`);
          console.log(`Options count: ${q.options.length}`);
          
          // Validate question text
          if (!q.question || typeof q.question !== 'string' || q.question.trim() === '') {
            console.error('Empty question content, skipping');
            continue;
          }
          
          // Insert the question
          const questionResult = await DatabaseService.execute(
            'INSERT INTO Questions (topic_id, content, is_multiple_choice) VALUES (?, ?, ?)',
            [id, q.question.trim(), isMultipleChoice ? 1 : 0]
          );
          
          const questionId = questionResult.insertId;
          console.log('Successfully inserted question with ID:', questionId);
          
          // Log all options
          console.log('Question options:');
          q.options.forEach((opt, idx) => {
            // Ensure safe string representation for logging
            const optionText = opt.text !== undefined && opt.text !== null 
              ? String(opt.text) 
              : '[EMPTY]';
            console.log(`  ${idx+1}. "${optionText}" (${opt.isCorrect ? 'CORRECT' : 'incorrect'})`);
          });
          
          // Thêm các đáp án cho câu hỏi
          let answersInserted = 0;
          for (const opt of q.options) {
            // Ensure opt.text is a string and handle null/undefined values
            const optionText = opt.text !== undefined && opt.text !== null 
              ? String(opt.text) 
              : '';
            
            // Skip empty options
            if (optionText.trim() === '') {
              console.warn('Skipping empty option');
              continue;
            }
            
            const isCorrect = opt.isCorrect ? 1 : 0;
            
            try {
              await DatabaseService.execute(
                'INSERT INTO Answers (question_id, content, is_correct, is_active) VALUES (?, ?, ?, TRUE)',
                [questionId, optionText.trim(), isCorrect]
              );
              console.log(`Added answer: "${optionText}" (${isCorrect ? 'CORRECT' : 'incorrect'})`);
              answersInserted++;
            } catch (answerError) {
              console.error(`Failed to insert answer "${optionText}":`, answerError);
            }
          }
          
          console.log(`Successfully inserted ${answersInserted} answers for question ID ${questionId}`);
          
          if (answersInserted === 0) {
            // No answers were inserted, delete the orphaned question
            console.warn('No answers were inserted, deleting orphaned question');
            await DatabaseService.execute('DELETE FROM Questions WHERE id = ?', [questionId]);
            continue;
          }
          
          inserted++;
        } catch (err) {
          console.error(`Error inserting question "${q.question}":`, err);
          // Continue with the next question even if this one failed
        }
      }
      
      // Cập nhật lại số lượng câu hỏi cho chuyên đề
      await DatabaseService.execute('UPDATE Topics SET question_count = question_count + ? WHERE id = ?', [inserted, id]);
      
      console.log(`Successfully imported ${inserted} questions for topic ID ${id}`);
      // Invalidate cache để đảm bảo lấy dữ liệu mới
      try {
        await CacheService.invalidateTopicCache(id);
  await CacheService.invalidateQuestionPools(id);
        console.log(`Invalidated cache for topic ${id} after importing questions`);
      } catch (e) {
        console.warn('Failed to invalidate cache after import:', e.message);
      }
      
      // Verify the import by checking the database
      if (inserted > 0) {
        try {
          console.log(`\n--- VERIFYING IMPORT RESULTS ---`);
          const questions = await DatabaseService.execute(
            'SELECT id, content, is_multiple_choice FROM Questions WHERE topic_id = ? ORDER BY id DESC LIMIT ?',
            [id, inserted]
          );
          
          console.log(`Found ${questions.length} recently imported questions`);
          
          // Check answers for each question
          for (const question of questions) {
            const answers = await DatabaseService.execute(
              'SELECT id, content, is_correct FROM Answers WHERE question_id = ? AND (is_active IS NULL OR is_active = TRUE)',
              [question.id]
            );
            
            console.log(`Question ID ${question.id}: "${question.content}" has ${answers.length} answers`);
            answers.forEach(a => console.log(`  - "${a.content}" (${a.is_correct ? 'CORRECT' : 'incorrect'})`));
          }
          
          console.log(`--- END VERIFICATION ---\n`);
        } catch (verifyError) {
          console.error('Error verifying import:', verifyError);
        }
      }
      
      return ResponseHelper.success(res, { 
        inserted,
        success: inserted > 0,
        message: `Đã import ${inserted} câu hỏi thành công` 
      }, `Đã import ${inserted} câu hỏi thành công`);
    } catch (error) {
      console.error('Import questions error:', error);
      return ResponseHelper.error(res, 'Lỗi server khi import câu hỏi: ' + error.message, 500);
    }
  }

  // Thêm hàm xóa câu hỏi
  static async deleteQuestion(req, res) {
    try {
      const { id } = req.params;
      const DatabaseService = require('../services/DatabaseService');
      // Lấy topic_id của câu hỏi
      const rows = await DatabaseService.execute('SELECT topic_id FROM Questions WHERE id = ?', [id]);
      if (!rows.length) {
        return ResponseHelper.error(res, 'Không tìm thấy câu hỏi', 404);
      }
      const topicId = rows[0].topic_id;
      // Xóa đáp án trước
      await DatabaseService.execute('DELETE FROM Answers WHERE question_id = ?', [id]);
      // Xóa câu hỏi
      await DatabaseService.execute('DELETE FROM Questions WHERE id = ?', [id]);
  // Đếm lại số lượng câu hỏi thực tế
  const countRows = await DatabaseService.execute('SELECT COUNT(*) as count FROM Questions WHERE topic_id = ?', [topicId]);
  const newCount = countRows[0]?.count ?? 0;
  await DatabaseService.execute('UPDATE Topics SET question_count = ? WHERE id = ?', [newCount, topicId]);
  // Invalidate cache để phản ánh số lượng câu hỏi mới
  try {
    await CacheService.invalidateTopicCache(topicId);
  await CacheService.invalidateQuestionPools(topicId);
    console.log(`Invalidated cache for topic ${topicId} after deleting question`);
  } catch (e) {
    console.warn('Failed to invalidate cache after delete:', e.message);
  }
  return ResponseHelper.success(res, { question_count: newCount }, 'Đã xóa câu hỏi thành công');
    } catch (error) {
      console.error('Delete question error:', error);
      return ResponseHelper.error(res, 'Lỗi server khi xóa câu hỏi', 500);
    }
  }

  // Thêm hàm updateQuestion vào TopicController để xử lý cập nhật nội dung và đáp án câu hỏi.
  static async updateQuestion(req, res) {
    try {
      const { id } = req.params;
      const { content, answers } = req.body;
      if (!content || !answers || !Array.isArray(answers) || answers.length === 0) {
        return ResponseHelper.error(res, 'Thiếu dữ liệu câu hỏi hoặc đáp án', 400);
      }
      const DatabaseService = require('../services/DatabaseService');
      
      // Lấy topicId để invalidate cache
      const questionInfo = await DatabaseService.execute('SELECT topic_id FROM Questions WHERE id = ?', [id]);
      const topicId = questionInfo.length > 0 ? questionInfo[0].topic_id : null;
      
      // Đếm số đáp án đúng để xác định loại câu hỏi
      const correctAnswersCount = answers.filter(ans => ans.isCorrect).length;
      const isMultipleChoice = correctAnswersCount > 1;
      
      // Cập nhật nội dung câu hỏi và loại câu hỏi
      await DatabaseService.execute(
        'UPDATE Questions SET content = ?, is_multiple_choice = ? WHERE id = ?', 
        [content, isMultipleChoice, id]
      );
      
      // Lấy danh sách đáp án cũ
      const oldAnswers = await DatabaseService.execute('SELECT id FROM Answers WHERE question_id = ?', [id]);
      
      // Kiểm tra đáp án nào đã được tham chiếu trong ExamAnswers
      const referencedAnswers = [];
      if (oldAnswers.length > 0) {
        const answerIds = oldAnswers.map(a => a.id);
        const referencedQuery = `SELECT DISTINCT answer_id FROM ExamAnswers WHERE answer_id IN (${answerIds.map(() => '?').join(',')})`;
        const referenced = await DatabaseService.execute(referencedQuery, answerIds);
        referencedAnswers.push(...referenced.map(r => r.answer_id));
      }
      
      // Xóa các đáp án không được tham chiếu
      if (oldAnswers.length > 0) {
        const safeToDelete = oldAnswers.filter(a => !referencedAnswers.includes(a.id));
        if (safeToDelete.length > 0) {
          const deleteIds = safeToDelete.map(a => a.id);
          const deleteQuery = `DELETE FROM Answers WHERE id IN (${deleteIds.map(() => '?').join(',')})`;
          await DatabaseService.execute(deleteQuery, deleteIds);
        }
      }
      
      // Cập nhật các đáp án đã được tham chiếu (đánh dấu là inactive thay vì xóa)
      if (referencedAnswers.length > 0) {
        // Thêm cột is_active nếu chưa có (sẽ chạy một lần)
        try {
          await DatabaseService.execute('ALTER TABLE Answers ADD COLUMN is_active BOOLEAN DEFAULT TRUE');
        } catch (e) {
          // Cột đã tồn tại, bỏ qua lỗi
        }
        
        // Đánh dấu các đáp án cũ là inactive
        const updateQuery = `UPDATE Answers SET is_active = FALSE WHERE id IN (${referencedAnswers.map(() => '?').join(',')})`;
        await DatabaseService.execute(updateQuery, referencedAnswers);
      }
      
      // Thêm đáp án mới
      for (const ans of answers) {
        await DatabaseService.execute(
          'INSERT INTO Answers (question_id, content, is_correct, is_active) VALUES (?, ?, ?, TRUE)', 
          [id, ans.text, ans.isCorrect ? 1 : 0]
        );
      }
      
      // Invalidate cache cho topic này
      if (topicId) {
        await CacheService.invalidateTopicCache(topicId);
  await CacheService.invalidateQuestionPools(topicId);
        console.log(`Invalidated cache for topic ${topicId} after question update`);
      }
      
      return ResponseHelper.success(res, {}, 'Cập nhật câu hỏi thành công');
    } catch (error) {
      console.error('Update question error:', error);
      return ResponseHelper.error(res, 'Lỗi server khi cập nhật câu hỏi', 500);
    }
  }

  // Thêm chuyên đề mới
  static async createTopic(req, res) {
    try {
      const { name, description, duration_minutes, pass_score } = req.body;
      
      // Validate input
      if (!name || !name.trim()) {
        return ResponseHelper.error(res, 'Tên chuyên đề không được để trống', 400);
      }
      
      if (!duration_minutes || duration_minutes < 1) {
        return ResponseHelper.error(res, 'Thời gian làm bài phải lớn hơn 0', 400);
      }
      
      if (pass_score === undefined || pass_score < 0 || pass_score > 100) {
        return ResponseHelper.error(res, 'Điểm đạt phải từ 0 đến 100', 400);
      }
      
      const DatabaseService = require('../services/DatabaseService');
      
      // Kiểm tra tên chuyên đề đã tồn tại chưa
      const existingTopic = await DatabaseService.execute(
        'SELECT id FROM Topics WHERE name = ?',
        [name.trim()]
      );
      
      if (existingTopic.length > 0) {
        return ResponseHelper.error(res, 'Tên chuyên đề đã tồn tại', 400);
      }
      
      // Thêm chuyên đề mới
      const result = await DatabaseService.execute(
        'INSERT INTO Topics (name, description, duration_minutes, pass_score, question_count) VALUES (?, ?, ?, ?, 0)',
        [name.trim(), description || '', duration_minutes, pass_score]
      );
      
      const newTopic = {
        id: result.insertId,
        name: name.trim(),
        description: description || '',
        duration_minutes: parseInt(duration_minutes),
        pass_score: parseInt(pass_score),
        totalQuestions: 0
      };
      
      console.log('Created new topic:', newTopic);
      
      return ResponseHelper.success(res, newTopic, 'Thêm chuyên đề thành công');
    } catch (error) {
      console.error('Create topic error:', error);
      return ResponseHelper.error(res, 'Lỗi server khi thêm chuyên đề', 500);
    }
  }

  // Cập nhật chuyên đề
  static async updateTopic(req, res) {
    try {
      const { id } = req.params;
      const { name, description, duration_minutes, pass_score } = req.body;
      
      // Validate input
      if (!name || !name.trim()) {
        return ResponseHelper.error(res, 'Tên chuyên đề không được để trống', 400);
      }
      
      if (!duration_minutes || duration_minutes < 1) {
        return ResponseHelper.error(res, 'Thời gian làm bài phải lớn hơn 0', 400);
      }
      
      if (pass_score === undefined || pass_score < 0 || pass_score > 100) {
        return ResponseHelper.error(res, 'Điểm đạt phải từ 0 đến 100', 400);
      }
      
      const DatabaseService = require('../services/DatabaseService');
      
      // Kiểm tra chuyên đề có tồn tại không
      const existingTopic = await DatabaseService.execute(
        'SELECT id FROM Topics WHERE id = ?',
        [id]
      );
      
      if (existingTopic.length === 0) {
        return ResponseHelper.error(res, 'Không tìm thấy chuyên đề', 404);
      }
      
      // Kiểm tra tên chuyên đề đã tồn tại ở chuyên đề khác chưa
      const duplicateName = await DatabaseService.execute(
        'SELECT id FROM Topics WHERE name = ? AND id != ?',
        [name.trim(), id]
      );
      
      if (duplicateName.length > 0) {
        return ResponseHelper.error(res, 'Tên chuyên đề đã tồn tại', 400);
      }
      
      // Cập nhật chuyên đề
      await DatabaseService.execute(
        'UPDATE Topics SET name = ?, description = ?, duration_minutes = ?, pass_score = ? WHERE id = ?',
        [name.trim(), description || '', duration_minutes, pass_score, id]
      );
      
      // Lấy thông tin chuyên đề sau khi cập nhật
      const updatedTopic = await DatabaseService.execute(
        'SELECT id, name, description, duration_minutes, pass_score, question_count as totalQuestions FROM Topics WHERE id = ?',
        [id]
      );
      
      // Invalidate cache
      try {
        await CacheService.invalidateTopicCache(id);
        console.log(`Invalidated cache for updated topic ${id}`);
      } catch (e) {
        console.warn('Cache invalidate failed for topic', id, e.message);
      }
      
      console.log('Updated topic:', updatedTopic[0]);
      
      return ResponseHelper.success(res, updatedTopic[0], 'Cập nhật chuyên đề thành công');
    } catch (error) {
      console.error('Update topic error:', error);
      return ResponseHelper.error(res, 'Lỗi server khi cập nhật chuyên đề', 500);
    }
  }

  // Xóa chuyên đề
  static async deleteTopic(req, res) {
    try {
      const { id } = req.params;
      const DatabaseService = require('../services/DatabaseService');
      
      // Kiểm tra chuyên đề có tồn tại không
      const existingTopic = await DatabaseService.execute(
        'SELECT id, name FROM Topics WHERE id = ?',
        [id]
      );
      
      if (existingTopic.length === 0) {
        return ResponseHelper.error(res, 'Không tìm thấy chuyên đề', 404);
      }
      
      // Kiểm tra có bài thi nào đang sử dụng chuyên đề này không
      const examCount = await DatabaseService.execute(
        'SELECT COUNT(*) as count FROM Exams WHERE topic_id = ?',
        [id]
      );
      
      if (examCount[0].count > 0) {
        return ResponseHelper.error(res, 
          `Không thể xóa chuyên đề này vì có ${examCount[0].count} bài thi đã sử dụng. Vui lòng xóa các bài thi trước.`, 
          400
        );
      }
      
      // Xóa tất cả câu hỏi và đáp án liên quan
      const questions = await DatabaseService.execute(
        'SELECT id FROM Questions WHERE topic_id = ?',
        [id]
      );
      
      for (const question of questions) {
        // Xóa đáp án
        await DatabaseService.execute(
          'DELETE FROM Answers WHERE question_id = ?',
          [question.id]
        );
      }
      
      // Xóa câu hỏi
      await DatabaseService.execute(
        'DELETE FROM Questions WHERE topic_id = ?',
        [id]
      );
      
      // Xóa chuyên đề
      await DatabaseService.execute(
        'DELETE FROM Topics WHERE id = ?',
        [id]
      );
      
      // Invalidate cache
      try {
        await CacheService.invalidateTopicCache(id);
        await CacheService.invalidateQuestionPools(id);
        console.log(`Invalidated cache for deleted topic ${id}`);
      } catch (e) {
        console.warn('Cache invalidate failed for topic', id, e.message);
      }
      
      console.log(`Deleted topic: ${existingTopic[0].name} (ID: ${id})`);
      
      return ResponseHelper.success(res, {}, 'Xóa chuyên đề thành công');
    } catch (error) {
      console.error('Delete topic error:', error);
      return ResponseHelper.error(res, 'Lỗi server khi xóa chuyên đề', 500);
    }
  }

  // Đồng bộ lại question_count của tất cả topics với dữ liệu thực tế trong bảng Questions
  static async syncQuestionCounts(req, res) {
    try {
      const DatabaseService = require('../services/DatabaseService');
      const topics = await DatabaseService.execute('SELECT id, question_count FROM Topics');
      const result = [];
      let updated = 0;
      for (const t of topics) {
        const rows = await DatabaseService.execute('SELECT COUNT(*) as cnt FROM Questions WHERE topic_id = ?', [t.id]);
        const realCount = rows[0]?.cnt ?? 0;
        if (realCount !== t.question_count) {
          await DatabaseService.execute('UPDATE Topics SET question_count = ? WHERE id = ?', [realCount, t.id]);
          try {
            await CacheService.invalidateTopicCache(t.id);
            await CacheService.invalidateQuestionPools(t.id);
          } catch (e) {
            console.warn('Cache invalidate failed for topic', t.id, e.message);
          }
          updated++;
          result.push({ topic_id: t.id, old: t.question_count, new: realCount });
        }
      }
      return ResponseHelper.success(res, {
        totalTopics: topics.length,
        updated,
        details: result
      }, 'Đồng bộ question_count hoàn tất');
    } catch (error) {
      console.error('Sync question counts error:', error);
      return ResponseHelper.error(res, 'Lỗi server khi đồng bộ question_count', 500);
    }
  }
}

module.exports = TopicController;
