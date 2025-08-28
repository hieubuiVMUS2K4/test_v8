import * as XLSX from 'xlsx';

// Tạo template Excel cho import sinh viên
export function createStudentImportTemplate() {
  // Dữ liệu mẫu với cấu trúc import sinh viên
  const sampleData = [
    {
      studentCode: "SV001",
      fullName: "Nguyễn Văn An",
      email: "an.nguyen@example.com", 
      phoneNumber: "0123456789",
      classId: "1",
      username: "SV001",
      password: "123456"
    },
    {
      studentCode: "SV002", 
      fullName: "Trần Thị Bình",
      email: "binh.tran@example.com",
      phoneNumber: "0987654321", 
      classId: "2",
      username: "SV002",
      password: "123456"
    },
    {
      studentCode: "SV003",
      fullName: "Lê Văn Cường", 
      email: "cuong.le@example.com",
      phoneNumber: "0345678901",
      classId: "1", 
      username: "SV003",
      password: "123456"
    }
  ];

  // Tạo workbook và worksheet
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(sampleData);
  
  // Thêm sheet dữ liệu
  XLSX.utils.book_append_sheet(wb, ws, "Sinh viên");
  
  // Tạo sheet hướng dẫn
  const wsInstructions = XLSX.utils.aoa_to_sheet([
    ["HƯỚNG DẪN IMPORT SINH VIÊN"],
    [""],
    ["1. Định dạng file:"],
    ["- File Excel (.xlsx hoặc .xls)"],
    ["- Sheet đầu tiên sẽ được đọc"],
    [""],
    ["2. Cấu trúc dữ liệu (các cột bắt buộc):"],
    [""],
    ["Tên cột", "Mô tả", "Ví dụ", "Bắt buộc"],
    ["studentCode", "Mã sinh viên (duy nhất)", "SV001", "Có"],
    ["fullName hoặc 'Họ tên'", "Họ và tên đầy đủ", "Nguyễn Văn An", "Có"],
    ["email hoặc 'Email'", "Email sinh viên", "an@example.com", "Có"],
    ["phoneNumber hoặc 'Số điện thoại'", "Số điện thoại", "0123456789", "Có"],
    ["classId hoặc 'Mã lớp'", "ID của lớp học", "1", "Có"],
    ["username", "Tên đăng nhập", "SV001", "Có"],
    ["password", "Mật khẩu", "123456", "Có"],
    [""],
    ["3. Lưu ý quan trọng:"],
    ["- Mã sinh viên (studentCode) phải duy nhất"],
    ["- Email không được trùng lặp"],
    ["- Username không được trùng lặp"],
    ["- classId phải tồn tại trong bảng Classes"],
    ["- Nếu thiếu bất kỳ thông tin bắt buộc nào, dòng đó sẽ bị bỏ qua"],
    ["- Mật khẩu mặc định là '123456' nếu không được cung cấp"],
    [""],
    ["4. Các định dạng cột hỗ trợ:"],
    ["- fullName hoặc 'Họ tên'"],
    ["- email hoặc 'Email'"],
    ["- phoneNumber hoặc 'Số điện thoại'"],
    ["- classId hoặc 'Mã lớp'"],
    ["- studentCode hoặc username"],
    [""],
    ["5. Ví dụ dữ liệu:"],
    ["studentCode: SV001"],
    ["fullName: Nguyễn Văn An"],
    ["email: an.nguyen@example.com"],
    ["phoneNumber: 0123456789"],
    ["classId: 1"],
    ["username: SV001"],
    ["password: 123456"]
  ]);
  
  // Thêm sheet hướng dẫn
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Hướng dẫn");
  
  // Tạo file buffer
  const wbout = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  
  // Chuyển thành blob để download
  const blob = new Blob([wbout], { type: 'application/octet-stream' });
  return blob;
}

// Hàm tạo và download template
export function downloadStudentTemplate() {
  try {
    const blob = createStudentImportTemplate();
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'student-import-template.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return true;
  } catch (error) {
    console.error('Error creating student template:', error);
    return false;
  }
}
