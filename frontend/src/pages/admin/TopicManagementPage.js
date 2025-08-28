// src/pages/admin/TopicManagementPage.jsx
import React, { useState, useEffect } from 'react';
import { 
  FaPlus, 
  FaSpinner, 
  FaExclamationCircle, 
  FaEye, 
  FaEdit, 
  FaTrash,
  FaTimes, 
  FaClock,
  FaTrophy,
  FaQuestionCircle,
  FaBookOpen,
  FaCheck,
  FaSave,
  FaBook,
  FaFileImport,
  FaDownload,
  FaUpload,
  FaCog
} from 'react-icons/fa';
import styles from './TopicManagementPage.module.css';
import { 
  getSubjects, 
  updateTopic,
  createTopic,
  deleteTopic,
  getTopicQuestions,
  importQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion
} from '../../services/apiService';
import * as XLSX from 'xlsx';
import { createQuestionTemplateExcel } from '../../utils/excelHelper';

const TopicManagementPage = () => {
  // State
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  // Edit Modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    duration_minutes: '',
    pass_score: '',
  });

  // Add Modal
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [addForm, setAddForm] = useState({
    name: '',
    description: '',
    duration_minutes: '45',
    pass_score: '60',
  });

  // Questions Modal
  const [viewQuestionsModalOpen, setViewQuestionsModalOpen] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [viewingSubject, setViewingSubject] = useState(null);

  // Add Question Modal
  const [addQuestionModalOpen, setAddQuestionModalOpen] = useState(false);
  const [addQuestionForm, setAddQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctOptions: []
  });

  // Edit Question Modal
  const [editQuestionModalOpen, setEditQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editQuestionForm, setEditQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctOptions: []
  });

  // Import Questions
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);

  // Fetch data
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setLoading(true);
        const data = await getSubjects();
        setSubjects(data.subjects || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching subjects:', err);
        setError('Không thể tải danh sách chuyên đề');
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, []);

  // Add Subject Functions
  const closeAddModal = () => {
    setAddModalOpen(false);
    setAddForm({
      name: '',
      description: '',
      duration_minutes: '45',
      pass_score: '60',
    });
  };

  const handleAddFormChange = (e) => {
    const { name, value } = e.target;
    setAddForm({ ...addForm, [name]: value });
  };

  const handleAddSubject = async (e) => {
    e.preventDefault();
    if (!addForm.name || !addForm.duration_minutes || !addForm.pass_score) {
      alert('Vui lòng điền đầy đủ thông tin chuyên đề!');
      return;
    }
    
    setSaving(true);
    try {
      const newSubject = await createTopic(
        addForm.name,
        addForm.description,
        parseInt(addForm.duration_minutes),
        parseInt(addForm.pass_score)
      );
      setSubjects([...subjects, newSubject]);
      alert('Thêm chuyên đề thành công!');
      closeAddModal();
    } catch (err) {
      alert('Lỗi khi thêm chuyên đề: ' + (err.message || 'Không thể thêm'));
    } finally {
      setSaving(false);
    }
  };

  // Edit Subject Functions
  const handleEditSubject = (subject) => {
    setEditingSubject(subject);
    setEditForm({
      name: subject.name,
      description: subject.description || '',
      duration_minutes: subject.duration_minutes || '',
      pass_score: subject.pass_score || '',
    });
    setEditModalOpen(true);
  };

  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditingSubject(null);
  };

  const handleEditFormChange = (e) => {
    const { name, value } = e.target;
    setEditForm({ ...editForm, [name]: value });
  };

  const handleSaveEditSubject = async (e) => {
    e.preventDefault();
    if (!editForm.name || !editForm.duration_minutes || !editForm.pass_score) {
      alert('Vui lòng điền đầy đủ thông tin chuyên đề!');
      return;
    }
    
    setSaving(true);
    try {
      const updated = await updateTopic(
        editingSubject.id,
        editForm.name,
        editForm.description,
        editForm.duration_minutes,
        editForm.pass_score
      );
      setSubjects(subjects.map(s => s.id === updated.id ? updated : s));
      alert('Cập nhật chuyên đề thành công!');
      closeEditModal();
    } catch (err) {
      alert('Lỗi khi cập nhật chuyên đề: ' + (err.message || 'Không thể cập nhật'));
    } finally {
      setSaving(false);
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chuyên đề này? Thao tác này không thể hoàn tác.')) {
      return;
    }
    
    setSaving(true);
    try {
      await deleteTopic(subjectId);
      setSubjects(subjects.filter(s => s.id !== subjectId));
      alert('Xóa chuyên đề thành công!');
    } catch (err) {
      alert('Lỗi khi xóa chuyên đề: ' + (err.message || 'Không thể xóa'));
    } finally {
      setSaving(false);
    }
  };

  // Questions Functions
  const handleViewQuestions = async (subject) => {
    setViewingSubject(subject);
    setViewQuestionsModalOpen(true);
    try {
      const data = await getTopicQuestions(subject.id);
      setQuestions(data.questions || data || []);
    } catch (err) {
      setQuestions([]);
      alert('Không thể tải câu hỏi: ' + (err.message || 'Lỗi server'));
    }
  };

  const closeViewQuestionsModal = () => {
    setViewQuestionsModalOpen(false);
    setViewingSubject(null);
    setQuestions([]);
  };

  const handleDeleteQuestion = async (questionId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa câu hỏi này?')) {
      setSaving(true);
      try {
        await deleteQuestion(questionId);
        alert('Xóa câu hỏi thành công!');
        handleViewQuestions(viewingSubject);
      } catch (err) {
        alert('Lỗi khi xóa câu hỏi: ' + (err.message || 'Không thể xóa'));
      } finally {
        setSaving(false);
      }
    }
  };

  // Add Question Functions
  const openAddQuestionModal = () => {
    setAddQuestionForm({
      question: '',
      options: ['', '', '', ''],
      correctOptions: []
    });
    setAddQuestionModalOpen(true);
  };

  const closeAddQuestionModal = () => {
    setAddQuestionModalOpen(false);
    setAddQuestionForm({
      question: '',
      options: ['', '', '', ''],
      correctOptions: []
    });
  };

  const handleAddQuestionFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('option_')) {
      const index = parseInt(name.split('_')[1]);
      const newOptions = [...addQuestionForm.options];
      newOptions[index] = value;
      setAddQuestionForm({ ...addQuestionForm, options: newOptions });
    } else {
      setAddQuestionForm({ ...addQuestionForm, [name]: value });
    }
  };

  const handleCorrectOptionChange = (index, isCorrect) => {
    const newCorrectOptions = isCorrect 
      ? [...addQuestionForm.correctOptions, index]
      : addQuestionForm.correctOptions.filter(i => i !== index);
    setAddQuestionForm({ ...addQuestionForm, correctOptions: newCorrectOptions });
  };

  // Edit Question Functions
  const openEditQuestionModal = (question) => {
    console.log('Opening edit modal for question:', question);
    setEditingQuestion(question);
    setEditQuestionForm({
      question: question.question,
      options: question.options?.map(opt => opt.text || opt) || ['', '', '', ''],
      correctOptions: question.options?.map((opt, idx) => opt.isCorrect ? idx : -1).filter(i => i !== -1) || []
    });
    setEditQuestionModalOpen(true);
  };

  const closeEditQuestionModal = () => {
    setEditQuestionModalOpen(false);
    setEditingQuestion(null);
    setEditQuestionForm({
      question: '',
      options: ['', '', '', ''],
      correctOptions: []
    });
  };

  const handleEditQuestionFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('option_')) {
      const index = parseInt(name.split('_')[1]);
      const newOptions = [...editQuestionForm.options];
      newOptions[index] = value;
      setEditQuestionForm({ ...editQuestionForm, options: newOptions });
    } else {
      setEditQuestionForm({ ...editQuestionForm, [name]: value });
    }
  };

  const handleEditCorrectOptionChange = (index, isCorrect) => {
    const newCorrectOptions = isCorrect 
      ? [...editQuestionForm.correctOptions, index]
      : editQuestionForm.correctOptions.filter(i => i !== index);
    setEditQuestionForm({ ...editQuestionForm, correctOptions: newCorrectOptions });
  };

  // Import Functions
  const openImportModal = () => {
    setImportModalOpen(true);
  };

  const closeImportModal = () => {
    setImportModalOpen(false);
    setImportFile(null);
  };

  const handleDownloadTemplate = () => {
    createQuestionTemplateExcel();
  };

  const handleAddQuestion = async () => {
    if (!addQuestionForm.question || addQuestionForm.options.some(opt => !opt.trim()) || addQuestionForm.correctOptions.length === 0) {
      alert('Vui lòng điền đầy đủ câu hỏi, đáp án và chọn ít nhất 1 đáp án đúng!');
      return;
    }

    setSaving(true);
    try {
      // Prepare answers array for API
      const answers = addQuestionForm.options.map((option, index) => ({
        text: option,
        isCorrect: addQuestionForm.correctOptions.includes(index)
      }));

      // Call API with separate parameters as expected
      await createQuestion(viewingSubject.id, addQuestionForm.question, answers);
      alert('Thêm câu hỏi thành công!');
      closeAddQuestionModal();
      handleViewQuestions(viewingSubject);
    } catch (err) {
      alert('Lỗi khi thêm câu hỏi: ' + (err.message || 'Không thể thêm'));
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateQuestion = async () => {
    if (!editQuestionForm.question || editQuestionForm.options.some(opt => !opt.trim()) || editQuestionForm.correctOptions.length === 0) {
      alert('Vui lòng điền đầy đủ câu hỏi, đáp án và chọn ít nhất 1 đáp án đúng!');
      return;
    }

    console.log('Updating question with ID:', editingQuestion.id);
    console.log('Question form data:', editQuestionForm);

    setSaving(true);
    try {
      // Prepare answers array for API
      const answers = editQuestionForm.options.map((option, index) => ({
        text: option,
        isCorrect: editQuestionForm.correctOptions.includes(index)
      }));

      console.log('Sending to API:', {
        id: editingQuestion.id,
        question: editQuestionForm.question,
        answers: answers
      });

      // Call API with separate parameters as expected
      await updateQuestion(editingQuestion.id, editQuestionForm.question, answers);
      alert('Cập nhật câu hỏi thành công!');
      closeEditQuestionModal();
      handleViewQuestions(viewingSubject);
    } catch (err) {
      console.error('Update question error:', err);
      alert('Lỗi khi cập nhật câu hỏi: ' + (err.message || 'Không thể cập nhật'));
    } finally {
      setSaving(false);
    }
  };

  const handleImportQuestions = async () => {
    if (!importFile || !viewingSubject) {
      alert('Vui lòng chọn file Excel');
      return;
    }

    setSaving(true);
    try {
      // Đọc file Excel
      const fileBuffer = await importFile.arrayBuffer();
      const workbook = XLSX.read(fileBuffer);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const data = XLSX.utils.sheet_to_json(worksheet);

      console.log('Excel data:', data);

      if (!data || data.length === 0) {
        throw new Error('File Excel không có dữ liệu hoặc định dạng không đúng');
      }

      // Chuyển đổi dữ liệu Excel thành format phù hợp
      const questions = data.map((row, index) => {
        console.log(`Processing row ${index + 1}:`, row);

        // Lấy nội dung câu hỏi - hỗ trợ nhiều định dạng cột
        const questionText = (row.question || row.Question || row['Câu hỏi'] || row['câu hỏi'] || '').toString();
        
        if (!questionText || questionText.trim() === '') {
          console.warn(`Row ${index + 1}: Missing question text`);
          return null;
        }

        // Lấy các đáp án - hỗ trợ nhiều định dạng cột
        const optionA = (row.optionA || row.OptionA || row['Đáp án A'] || row['đáp án A'] || '').toString();
        const optionB = (row.optionB || row.OptionB || row['Đáp án B'] || row['đáp án B'] || '').toString();
        const optionC = (row.optionC || row.OptionC || row['Đáp án C'] || row['đáp án C'] || '').toString();
        const optionD = (row.optionD || row.OptionD || row['Đáp án D'] || row['đáp án D'] || '').toString();

        // Lấy đáp án đúng - hỗ trợ nhiều định dạng cột
        const correctOption = (row.correctOption || row.CorrectOption || row['Đáp án đúng'] || row['đáp án đúng'] || row.correctAnswer || '').toString().toUpperCase();
        
        console.log(`Row ${index + 1} - Question: "${questionText}"`);
        console.log(`Options: A="${optionA}", B="${optionB}", C="${optionC}", D="${optionD}"`);
        console.log(`Correct: "${correctOption}"`);
        
        // Tạo mảng options
        const options = [];
        if (optionA.trim()) options.push({ text: optionA.trim(), isCorrect: false });
        if (optionB.trim()) options.push({ text: optionB.trim(), isCorrect: false });
        if (optionC.trim()) options.push({ text: optionC.trim(), isCorrect: false });
        if (optionD.trim()) options.push({ text: optionD.trim(), isCorrect: false });

        if (options.length < 2) {
          console.warn(`Row ${index + 1}: Question needs at least 2 options`);
          return null;
        }

        // Xác định đáp án đúng
        const correctAnswers = correctOption.split(',').map(s => s.trim()).filter(s => s);
        
        // Đánh dấu đáp án đúng
        correctAnswers.forEach(answer => {
          switch(answer) {
            case 'A':
              if (options[0]) options[0].isCorrect = true;
              break;
            case 'B':
              if (options[1]) options[1].isCorrect = true;
              break;
            case 'C':
              if (options[2]) options[2].isCorrect = true;
              break;
            case 'D':
              if (options[3]) options[3].isCorrect = true;
              break;
            default:
              console.warn(`Invalid correct answer option: ${answer}`);
              break;
          }
        });

        // Nếu không có đáp án đúng nào được đánh dấu, đặt đáp án đầu tiên là đúng
        if (!options.some(opt => opt.isCorrect)) {
          console.warn(`Row ${index + 1}: No correct answer specified, setting first option as correct`);
          options[0].isCorrect = true;
        }

        // Xác định loại câu hỏi
        const questionType = correctAnswers.length > 1 ? 'multiple_choice' : 'single_choice';

        console.log(`Row ${index + 1} - Final options:`, options.map((opt, i) => `${String.fromCharCode(65+i)}: ${opt.text} (${opt.isCorrect ? 'CORRECT' : 'wrong'})`));

        return {
          question: questionText.trim(),
          options: options,
          type: questionType
        };
      }).filter(q => q !== null); // Loại bỏ các câu hỏi không hợp lệ

      console.log('Processed questions:', questions);

      if (questions.length === 0) {
        throw new Error('Không có câu hỏi hợp lệ nào để import. Vui lòng kiểm tra lại định dạng file.');
      }

      // Gọi API import
      console.log('Calling importQuestions API with:', { topicId: viewingSubject.id, questionsCount: questions.length });
      await importQuestions(viewingSubject.id, questions);
      alert(`Import thành công ${questions.length} câu hỏi!`);
      closeImportModal();
      handleViewQuestions(viewingSubject);
    } catch (err) {
      console.error('Import error:', err);
      alert('Lỗi import: ' + (err.message || 'Không thể import'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <FaSpinner className="fa-spin" />
          <p>Đang tải danh sách chuyên đề...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <FaExclamationCircle />
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>
            <FaBookOpen />
            Quản lý chuyên đề
          </h1>
          <p>Quản lý các chuyên đề thi và câu hỏi</p>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.addBtn}
            onClick={() => setAddModalOpen(true)}
            disabled={saving}
          >
            <FaPlus />
            Thêm chuyên đề
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.stats}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaBookOpen />
          </div>
          <div className={styles.statInfo}>
            <h3>{subjects.length}</h3>
            <p>Tổng chuyên đề</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaQuestionCircle />
          </div>
          <div className={styles.statInfo}>
            <h3>{subjects.reduce((total, subject) => total + (subject.totalQuestions ?? subject.question_count ?? 0), 0)}</h3>
            <p>Tổng câu hỏi</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaClock />
          </div>
          <div className={styles.statInfo}>
            <h3>{Math.round(subjects.reduce((total, subject) => total + (subject.duration_minutes || 45), 0) / (subjects.length || 1))}</h3>
            <p>Thời gian TB (phút)</p>
          </div>
        </div>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FaTrophy />
          </div>
          <div className={styles.statInfo}>
            <h3>{Math.round(subjects.reduce((total, subject) => total + (subject.pass_score || 60), 0) / (subjects.length || 1))}</h3>
            <p>Điểm đạt TB (%)</p>
          </div>
        </div>
      </div>
        
      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Chuyên đề</th>
              <th>Số câu hỏi</th>
              <th>Thời gian</th>
              <th>Điểm đạt</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {subjects.length > 0 ? (
              subjects.map(subject => (
                <tr key={subject.id}>
                  <td>
                    <div className={styles.topicInfo}>
                      <div className={styles.topicIcon}>
                        <FaBook />
                      </div>
                      <div>
                        <div className={styles.topicName}>{subject.name}</div>
                        <div className={styles.topicDescription}>
                          {subject.description || 'Không có mô tả'}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={styles.questionCount}>
                      <FaQuestionCircle style={{marginRight: '0.3rem'}} />
                      {subject.totalQuestions ?? subject.question_count ?? 0} câu
                    </span>
                  </td>
                  <td>
                    <span className={styles.duration}>
                      <FaClock style={{marginRight: '0.3rem'}} />
                      {subject.duration_minutes || 45} phút
                    </span>
                  </td>
                  <td>
                    <span className={styles.passScore}>
                      <FaTrophy style={{marginRight: '0.3rem'}} />
                      {subject.pass_score || 60}%
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={`${styles.actionBtn} ${styles.viewBtn}`}
                        onClick={() => handleViewQuestions(subject)}
                        title="Xem câu hỏi"
                        disabled={saving}
                      >
                        <FaEye />
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        onClick={() => handleEditSubject(subject)}
                        title="Sửa chuyên đề"
                        disabled={saving}
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDeleteSubject(subject.id)}
                        title="Xóa chuyên đề"
                        disabled={saving}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">
                  <div className={styles.noData}>
                    <FaBookOpen />
                    <p>Chưa có chuyên đề nào</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal thêm chuyên đề */}
      {addModalOpen && (
        <div className={styles.modalOverlay} onClick={closeAddModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <FaPlus />
                Thêm chuyên đề mới
              </h2>
              <button className={styles.closeBtn} onClick={closeAddModal}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleAddSubject} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Tên chuyên đề:</label>
                <input 
                  type="text"
                  name="name"
                  value={addForm.name}
                  onChange={handleAddFormChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Mô tả:</label>
                <textarea
                  name="description"
                  value={addForm.description}
                  onChange={handleAddFormChange}
                  rows="3"
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Thời gian (phút):</label>
                  <input 
                    type="number"
                    name="duration_minutes"
                    value={addForm.duration_minutes}
                    onChange={handleAddFormChange}
                    required
                    min="1"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Điểm đạt:</label>
                  <input 
                    type="number"
                    name="pass_score"
                    value={addForm.pass_score}
                    onChange={handleAddFormChange}
                    required
                    min="1"
                    max="100"
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  <FaSave />
                  Thêm
                </button>
                <button type="button" onClick={closeAddModal} className={styles.btnSecondary} disabled={saving}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal sửa chuyên đề */}
      {editModalOpen && (
        <div className={styles.modalOverlay} onClick={closeEditModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <FaEdit />
                Sửa chuyên đề
              </h2>
              <button className={styles.closeBtn} onClick={closeEditModal}>
                <FaTimes />
              </button>
            </div>
            <form onSubmit={handleSaveEditSubject} className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Tên chuyên đề:</label>
                <input 
                  type="text"
                  name="name"
                  value={editForm.name}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Mô tả:</label>
                <textarea
                  name="description"
                  value={editForm.description}
                  onChange={handleEditFormChange}
                  rows="3"
                />
              </div>
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>Thời gian (phút):</label>
                  <input 
                    type="number"
                    name="duration_minutes"
                    value={editForm.duration_minutes}
                    onChange={handleEditFormChange}
                    required
                    min="1"
                  />
                </div>
                <div className={styles.formGroup}>
                  <label>Điểm đạt:</label>
                  <input 
                    type="number"
                    name="pass_score"
                    value={editForm.pass_score}
                    onChange={handleEditFormChange}
                    required
                    min="1"
                    max="100"
                  />
                </div>
              </div>
              <div className={styles.modalActions}>
                <button type="submit" className={styles.btnPrimary} disabled={saving}>
                  <FaSave />
                  Lưu
                </button>
                <button type="button" onClick={closeEditModal} className={styles.btnSecondary} disabled={saving}>
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal xem câu hỏi */}
      {viewQuestionsModalOpen && (
        <div className={styles.modalOverlay} onClick={closeViewQuestionsModal}>
          <div className={`${styles.modal} ${styles.questionsModal}`} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <FaQuestionCircle />
                Câu hỏi: {viewingSubject?.name}
              </h2>
              <div className={styles.headerActions}>
                <button 
                  className={styles.addBtn}
                  onClick={openAddQuestionModal}
                  disabled={saving}
                >
                  <FaPlus />
                  Thêm câu hỏi
                </button>
                <button 
                  className={styles.addBtn}
                  onClick={openImportModal}
                  disabled={saving}
                >
                  <FaFileImport />
                  Import Excel
                </button>
                <button className={styles.closeBtn} onClick={closeViewQuestionsModal}>
                  <FaTimes />
                </button>
              </div>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.questionsList}>
                {questions.length > 0 ? (
                  <ul className={styles.questionList}>
                    {questions.map((q, idx) => (
                      <li key={q.id} className={styles.questionItem}>
                        <div className={styles.questionHeader}>
                          <div className={styles.questionText}>
                            <strong>Câu {idx + 1}:</strong> {q.question}
                          </div>
                          <div className={styles.questionActions}>
                            <button 
                              className={`${styles.actionBtn} ${styles.editBtn}`} 
                              onClick={() => openEditQuestionModal(q)}
                              title="Sửa câu hỏi"
                              disabled={saving}
                            >
                              <FaEdit />
                            </button>
                            <button 
                              className={`${styles.actionBtn} ${styles.deleteBtn}`} 
                              onClick={() => handleDeleteQuestion(q.id)}
                              title="Xóa câu hỏi"
                              disabled={saving}
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>
                        <div className={styles.answersList}>
                          {q.options.map((opt, optIdx) => (
                            <div key={opt.id || optIdx} className={`${styles.answerItem} ${opt.isCorrect ? 'correct' : ''}`}>
                              <div className={styles.answerLabel}>
                                {String.fromCharCode(65 + optIdx)}
                              </div>
                              <span>{opt.text || opt}</span>
                              {opt.isCorrect && (
                                <FaCheck style={{ color: 'var(--color-success)', marginLeft: '0.5rem' }} />
                              )}
                            </div>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className={styles.noData}>
                    <FaQuestionCircle />
                    <p>Chuyên đề này chưa có câu hỏi nào.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal thêm câu hỏi */}
      {addQuestionModalOpen && (
        <div className={styles.modalOverlay} onClick={closeAddQuestionModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <FaPlus />
                Thêm câu hỏi mới
              </h2>
              <button className={styles.closeBtn} onClick={closeAddQuestionModal}>
                <FaTimes />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Câu hỏi:</label>
                <textarea
                  name="question"
                  value={addQuestionForm.question}
                  onChange={handleAddQuestionFormChange}
                  rows="3"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Các đáp án:</label>
                {addQuestionForm.options.map((option, index) => (
                  <div key={index} className={styles.optionRow}>
                    <input
                      type="text"
                      name={`option_${index}`}
                      value={option}
                      onChange={handleAddQuestionFormChange}
                      placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                      required
                    />
                    <label className={styles.correctCheckbox}>
                      <input
                        type="checkbox"
                        checked={addQuestionForm.correctOptions.includes(index)}
                        onChange={(e) => handleCorrectOptionChange(index, e.target.checked)}
                      />
                      Đúng
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnPrimary} onClick={handleAddQuestion} disabled={saving}>
                <FaSave />
                Thêm
              </button>
              <button type="button" onClick={closeAddQuestionModal} className={styles.btnSecondary} disabled={saving}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal sửa câu hỏi */}
      {editQuestionModalOpen && (
        <div className={styles.modalOverlay} onClick={closeEditQuestionModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <FaEdit />
                Sửa câu hỏi
              </h2>
              <button className={styles.closeBtn} onClick={closeEditQuestionModal}>
                <FaTimes />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.formGroup}>
                <label>Câu hỏi:</label>
                <textarea
                  name="question"
                  value={editQuestionForm.question}
                  onChange={handleEditQuestionFormChange}
                  rows="3"
                  required
                />
              </div>
              <div className={styles.formGroup}>
                <label>Các đáp án:</label>
                {editQuestionForm.options.map((option, index) => (
                  <div key={index} className={styles.optionRow}>
                    <input
                      type="text"
                      name={`option_${index}`}
                      value={option}
                      onChange={handleEditQuestionFormChange}
                      placeholder={`Đáp án ${String.fromCharCode(65 + index)}`}
                      required
                    />
                    <label className={styles.correctCheckbox}>
                      <input
                        type="checkbox"
                        checked={editQuestionForm.correctOptions.includes(index)}
                        onChange={(e) => handleEditCorrectOptionChange(index, e.target.checked)}
                      />
                      Đúng
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.btnPrimary} onClick={handleUpdateQuestion} disabled={saving}>
                <FaSave />
                Lưu
              </button>
              <button type="button" onClick={closeEditQuestionModal} className={styles.btnSecondary} disabled={saving}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal import Excel */}
      {importModalOpen && (
        <div className={styles.modalOverlay} onClick={closeImportModal}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h2>
                <FaFileImport />
                Import câu hỏi từ Excel
              </h2>
              <button className={styles.closeBtn} onClick={closeImportModal}>
                <FaTimes />
              </button>
            </div>
            <div className={styles.modalBody}>
              <div className={styles.importSection}>
                <h4>Tải lên file Excel</h4>
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={(e) => setImportFile(e.target.files[0])}
                />
                <div className={styles.importActions}>
                  <button
                    className={styles.templateBtn}
                    onClick={handleDownloadTemplate}
                    type="button"
                  >
                    <FaDownload />
                    Tải mẫu Excel
                  </button>
                  <button
                    className={styles.importBtn}
                    onClick={handleImportQuestions}
                    disabled={!importFile || saving}
                    type="button"
                  >
                    <FaUpload />
                    Import
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Saving overlay */}
      {saving && (
        <div className={styles.savingOverlay}>
          <div className={styles.savingContent}>
            <FaSpinner className="fa-spin" />
            <p>Đang lưu dữ liệu...</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicManagementPage;
