# Cài đặt Chức Năng Làm Bài Thi

Tài liệu này cung cấp hướng dẫn để cài đặt và sử dụng chức năng làm bài thi cho sinh viên.

## 1. Cài đặt Cơ Sở Dữ Liệu

Chạy script để tạo các bảng cần thiết cho chức năng làm bài thi:

```
cd backend
node scripts/setupExamTables.js
```

Script này sẽ tự động kiểm tra và tạo hai bảng:
- `Exams`: Lưu thông tin về các kỳ thi
- `ExamAnswers`: Lưu thông tin về các câu trả lời của sinh viên

## 2. Quy Trình Làm Bài Thi

### Backend:

1. Sinh viên yêu cầu làm bài thi cho một chuyên đề:
   - Gọi API `GET /topics/:topicId/exam-questions`
   - Backend sẽ tạo một `examId` và trả về danh sách câu hỏi

2. Sinh viên nộp bài thi:
   - Gọi API `POST /exams/:examId/submit` với danh sách câu trả lời
   - Backend sẽ chấm điểm và lưu kết quả

3. Xem lịch sử bài thi:
   - Gọi API `GET /exams/student/history`
   - Backend trả về danh sách các bài thi đã làm

### Frontend:

1. `ExamExecutionPage.js` đã được cập nhật để làm việc với API mới:
   - Khi tải trang, gọi API để lấy câu hỏi bài thi
   - Khi nộp bài, gửi câu trả lời lên server để chấm điểm

## 3. Cấu Trúc Dữ Liệu

### Câu hỏi bài thi (API response):

```json
{
  "examId": "exam_1629789456_123_456",
  "topic": {
    "id": 1,
    "name": "Tên chuyên đề",
    "timeLimit": 60,
    "passScore": 70
  },
  "questions": [
    {
      "id": 1,
      "question": "Nội dung câu hỏi",
      "type": "single_choice",
      "options": [
        {
          "id": "A",
          "text": "Đáp án A",
          "isCorrect": true
        },
        {
          "id": "B",
          "text": "Đáp án B",
          "isCorrect": false
        }
      ]
    }
  ]
}
```

### Nộp bài thi (API request):

```json
{
  "answers": {
    "1": ["A"],
    "2": ["B", "C"]
  }
}
```

### Kết quả bài thi (API response):

```json
{
  "examId": "exam_1629789456_123_456",
  "score": 80,
  "correctAnswers": 8,
  "totalQuestions": 10,
  "passScore": 70,
  "passed": true
}
```

## 4. Xử Lý Lỗi và Bảo Mật

- Nếu sinh viên đã nộp bài, không cho phép nộp lại
- Kiểm tra thời gian làm bài để đảm bảo sinh viên không làm quá thời gian quy định
- Lưu log chi tiết để theo dõi và gỡ lỗi

## 5. Testing

Để test chức năng làm bài thi:

1. Đăng nhập với tài khoản sinh viên
2. Vào trang danh sách chuyên đề và chọn một chuyên đề
3. Bắt đầu làm bài và nộp bài
4. Kiểm tra kết quả được lưu trong cơ sở dữ liệu
