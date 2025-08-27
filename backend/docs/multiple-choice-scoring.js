/**
 * LOGIC TÍNH ĐIỂM CHO CÂU HỎI MULTIPLE CHOICE
 * 
 * Ví dụ: Câu hỏi có 3 đáp án đúng (A, B, D) và 1 đáp án sai (C)
 * 
 * Các trường hợp:
 * 
 * 1. Chọn đúng tất cả (A, B, D): 
 *    - correctlySelected = 3
 *    - wronglySelected = 0
 *    - Score = (3/3) - (0/3) = 1.0 (100%)
 * 
 * 2. Chọn thiếu (chỉ A, B):
 *    - correctlySelected = 2  
 *    - wronglySelected = 0
 *    - Score = (2/3) - (0/3) = 0.67 (67%)
 * 
 * 3. Chọn thừa (A, B, D, C):
 *    - correctlySelected = 3
 *    - wronglySelected = 1
 *    - Score = (3/3) - (1/3) = 0.67 (67%)
 * 
 * 4. Chọn sai hoàn toàn (chỉ C):
 *    - correctlySelected = 0
 *    - wronglySelected = 1  
 *    - Score = (0/3) - (1/3) = -0.33 → 0 (0%, minimum là 0)
 * 
 * 5. Chọn 1 đúng 1 sai (A, C):
 *    - correctlySelected = 1
 *    - wronglySelected = 1
 *    - Score = (1/3) - (1/3) = 0 (0%)
 * 
 * 6. Không chọn gì:
 *    - Score = 0 (0%)
 */

// Công thức tính điểm cuối cùng:
// questionScore = Math.max(0, (correctlySelected / totalCorrectAnswers) - (wronglySelected / totalCorrectAnswers))

module.exports = {};
