# Icon Standardization Summary

## Thay đổi thực hiện

### 1. TopicManagementPage.js

- **Import**: Thay `FaWrench` → `FaEdit`, `FaTimes` → `FaTrash` (cho delete)
- **Edit buttons**: Tất cả `FaWrench` → `FaEdit`
- **Delete buttons**: Tất cả `FaTimes` → `FaTrash`

### 2. StudentManagementPage.js

- **Import**: Thay `FaWrench` → `FaEdit`, thêm `FaTrash`
- **Edit buttons**: `FaWrench` → `FaEdit`
- **Delete buttons**: `FaTimes` → `FaTrash`, `<i className="fas fa-trash">` → `<FaTrash />`

### 3. AcademicStructureManagementPage.js (đã có sẵn)

- **View buttons**: `FaEye`
- **Edit buttons**: `FaEdit`
- **Delete buttons**: `FaTrash`

## Kết quả

Tất cả các trang quản lý admin giờ đây sử dụng cùng một bộ icon nhất quán:

| Thao tác     | Icon      | Màu sắc        |
| ------------ | --------- | -------------- |
| Xem chi tiết | `FaEye`   | Primary blue   |
| Chỉnh sửa    | `FaEdit`  | Warning orange |
| Xóa          | `FaTrash` | Danger red     |

Điều này tạo ra trải nghiệm người dùng nhất quán và trực quan hơn trong toàn bộ admin panel.

## CSS Classes được sử dụng

```css
.viewBtn {
  background: var(--color-primary-soft);
  color: var(--color-primary);
}

.editBtn {
  background: var(--color-warning);
  color: white;
}

.deleteBtn {
  background: var(--color-danger-soft);
  color: var(--color-danger);
}
```

## Lưu ý

- Tất cả các trang đều import các icon cần thiết từ `react-icons/fa`
- CSS modules đã được thiết kế để hỗ trợ các icon này
- Hover effects và transitions được áp dụng nhất quán
