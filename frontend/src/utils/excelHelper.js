import * as XLSX from 'xlsx';

// Create a sample Excel template for question import
export function createQuestionTemplateExcel() {
  // Sample data
  const data = [
    {
      question: "Câu hỏi mẫu 1?",
      optionA: "Đáp án A",
      optionB: "Đáp án B",
      optionC: "Đáp án C",
      optionD: "Đáp án D",
      correctAnswer: "A",
      type: "single_choice"
    },
    {
      question: "Câu hỏi mẫu 2?",
      optionA: "Đáp án A",
      optionB: "Đáp án B",
      optionC: "Đáp án C",
      optionD: "Đáp án D",
      correctAnswer: "B",
      type: "single_choice"
    },
    {
      question: "Câu hỏi mẫu 3 (trắc nghiệm nhiều đáp án)?",
      optionA: "Đáp án A đúng",
      optionB: "Đáp án B đúng",
      optionC: "Đáp án C sai",
      optionD: "Đáp án D sai",
      correctAnswer: "A,B", // Nhiều đáp án đúng, phân cách bằng dấu phẩy
      type: "multiple_choice"
    },
    {
      question: "Câu hỏi mẫu 4?",
      "Đáp án A": "Nội dung đáp án A", // Định dạng đáp án khác
      "Đáp án B": "Nội dung đáp án B",
      "Đáp án C": "Nội dung đáp án C", 
      "Đáp án D": "Nội dung đáp án D",
      "Đáp án đúng": "C", // Định dạng tên cột khác
      "Loại câu hỏi": "single_choice" // Định dạng tên cột khác
    }
  ];

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);
  
  // (Removed unused headerComment helper array)
  
  // Add the sheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, "Questions");
  
  // Create another sheet for instructions
  const wsInstructions = XLSX.utils.aoa_to_sheet([
    ["HƯỚNG DẪN IMPORT CÂU HỎI"],
    [""],
    ["1. Định dạng file:"],
    ["- File Excel (.xlsx hoặc .xls)"],
    ["- Sheet đầu tiên chứa dữ liệu câu hỏi"],
    [""],
    ["2. Cấu trúc dữ liệu:"],
    ["- question/Câu hỏi: Nội dung câu hỏi (bắt buộc)"],
    ["- optionA/Đáp án A, optionB/Đáp án B, optionC/Đáp án C, optionD/Đáp án D: Các phương án trả lời (tối thiểu 2 phương án)"],
    ["- correctAnswer/Đáp án đúng: Đáp án đúng, nhập chữ cái A, B, C hoặc D tương ứng với đáp án đúng"],
    ["  + Với câu hỏi nhiều đáp án: Liệt kê các đáp án đúng, phân cách bằng dấu phẩy (VD: A,C)"],
    ["- type/Loại câu hỏi: Loại câu hỏi (single_choice hoặc multiple_choice, mặc định là single_choice)"],
    [""],
    ["3. Các định dạng cột được hỗ trợ:"],
    ["- Câu hỏi: 'question', 'Question', 'câu hỏi', 'Câu hỏi'"],
    ["- Đáp án: 'optionA', 'option A', 'Option A', 'đáp án A', 'Đáp án A', 'A'"],
    ["  (Tương tự cho B, C, D)"],
    ["- Đáp án đúng: 'correctAnswer', 'correct answer', 'Correct Answer', 'đáp án đúng', 'Đáp án đúng'"],
    ["- Loại câu hỏi: 'type', 'loại câu hỏi', 'Loại câu hỏi'"],
    [""],
    ["4. Lưu ý:"],
    ["- Mỗi hàng là một câu hỏi"],
    ["- Không để trống cột câu hỏi"],
    ["- Mỗi câu hỏi phải có ít nhất 2 phương án trả lời"],
    ["- Nếu không xác định được đáp án đúng, đáp án đầu tiên sẽ được chọn là đúng"],
    ["- Bạn có thể đánh dấu đáp án đúng bằng cách thêm dấu * vào đầu hoặc cuối của đáp án"],
    ["  Ví dụ: '*Đây là đáp án đúng' hoặc 'Đây là đáp án đúng*'"]
  ]);
  
  // Add the instructions sheet
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Hướng dẫn");
  
  // Generate array buffer
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  
  // Convert to blob and download
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  return blob;
}
