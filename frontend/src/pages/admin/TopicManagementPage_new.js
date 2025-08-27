// src/pages/admin/TopicManagementPage.jsx
import React, { useState, useEffect } from 'react';
import styles from './TopicManagementPage.module.css';
import { 
  getSubjects, 
  updateTopic,
  createTopic,
  deleteTopic,
  getTopicQuestions,
  importQuestions,
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

  // Edit Question
  const [editingQuestion, setEditingQuestion] = useState(null);
  const [editQuestionForm, setEditQuestionForm] = useState({
    question: '',
    options: ['', '', '', ''],
    correctOptions: []
  });

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
    }
  };

  // Delete Subject
  const handleDeleteSubject = async (subjectId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chuyên đề này? Thao tác này không thể hoàn tác.')) {
      return;
    }
    try {
      await deleteTopic(subjectId);
      setSubjects(subjects.filter(s => s.id !== subjectId));
      alert('Xóa chuyên đề thành công!');
    } catch (err) {
      alert('Lỗi khi xóa chuyên đề: ' + (err.message || 'Không thể xóa'));
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
      try {
        await deleteQuestion(questionId);
        alert('Xóa câu hỏi thành công!');
        handleViewQuestions(viewingSubject);
      } catch (err) {
        alert('Lỗi khi xóa câu hỏi: ' + (err.message || 'Không thể xóa'));
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>
          <i className="fas fa-spinner fa-spin"></i>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2 className={styles.sectionTitle}>Quản lý chuyên đề</h2>
          <p>Quản lý các chuyên đề thi và câu hỏi</p>
        </div>
        <div className={styles.headerRight}>
          <button 
            className={styles.addBtn}
            onClick={() => setAddModalOpen(true)}
          >
            <i className="fas fa-plus"></i> Thêm chuyên đề
          </button>
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
                        <i className="fas fa-book"></i>
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
                      {subject.totalQuestions ?? subject.question_count ?? 0} câu
                    </span>
                  </td>
                  <td>
                    <span className={styles.duration}>
                      {subject.duration_minutes || 45} phút
                    </span>
                  </td>
                  <td>
                    <span className={styles.passScore}>
                      {subject.pass_score || 70} điểm
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button 
                        className={`${styles.actionBtn} ${styles.viewBtn}`}
                        onClick={() => handleViewQuestions(subject)}
                        title="Xem câu hỏi"
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        onClick={() => handleEditSubject(subject)}
                        title="Sửa chuyên đề"
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                      <button 
                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                        onClick={() => handleDeleteSubject(subject.id)}
                        title="Xóa chuyên đề"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5">
                  <div className={styles.noData}>
                    <i className="fas fa-inbox"></i>
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
              <h3>Thêm chuyên đề mới</h3>
              <button className={styles.closeBtn} onClick={closeAddModal}>
                <i className="fas fa-times"></i>
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
                <button type="submit" className={styles.saveBtn}>
                  <i className="fas fa-save"></i> Thêm
                </button>
                <button type="button" onClick={closeAddModal} className={styles.cancelBtn}>
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
              <h3>Sửa chuyên đề</h3>
              <button className={styles.closeBtn} onClick={closeEditModal}>
                <i className="fas fa-times"></i>
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
                <button type="submit" className={styles.saveBtn}>
                  <i className="fas fa-save"></i> Lưu
                </button>
                <button type="button" onClick={closeEditModal} className={styles.cancelBtn}>
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
              <h3>Câu hỏi: {viewingSubject?.name}</h3>
              <button className={styles.closeBtn} onClick={closeViewQuestionsModal}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className={styles.modalBody}>
              <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                {questions.length > 0 ? (
                  <ul className={styles.questionList}>
                    {questions.map((q, idx) => (
                      <li key={q.id} className={styles.questionItem}>
                        <strong>Câu {idx + 1}:</strong> {q.question}
                        <ul className={styles.optionList}>
                          {q.options.map((opt, optIdx) => (
                            <li key={opt.id || optIdx} className={`${styles.optionItem} ${opt.isCorrect ? styles.correctOption : ''}`}>
                              <span className={styles.optionText}>{String.fromCharCode(65 + optIdx)}. {opt.text || opt}</span>
                              {opt.isCorrect && (
                                <span className={styles.correctIcon} title="Đáp án đúng">
                                  <i className="fas fa-check"></i>
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                        <button className={styles.deleteBtn} onClick={() => handleDeleteQuestion(q.id)}>
                          <i className="fas fa-trash"></i> Xóa
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div>Chuyên đề này chưa có câu hỏi nào.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TopicManagementPage;
