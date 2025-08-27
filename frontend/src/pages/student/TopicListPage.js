import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSubjects, getUserProgress, canTakeQuiz } from '../../services/apiService';
import styles from './TopicListPage.module.css';
import { useAuth } from '../../hooks/useAuth';

const TopicListPage = () => {
  const { user, isAuthenticated, logout } = useAuth();
  
  console.log('=== AUTH DEBUG ===');
  console.log('User:', user);
  console.log('Is authenticated:', isAuthenticated);
  console.log('User type:', user?.type);
  console.log('=== AUTH END ===');
  const [subjects, setSubjects] = useState([]);
  const [userProgress, setUserProgress] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sửa userInfo: lấy từ user thực tế
  const [userInfo, setUserInfo] = useState({
    name: '',
    class: '',
    major: '',
    department: '',
    totalCompleted: 0,
    totalSubjects: 0,
    averageScore: 0
  });

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Log thông tin user để debug
        console.log('===== DEBUG USER INFO =====');
        console.log('User object:', user);
        console.log('User ID:', user?.id);
        console.log('Username:', user?.username);
        console.log('Role:', user?.role);
        console.log('Type:', user?.type);
        console.log('Department:', user?.department);
        console.log('Major:', user?.major);
        console.log('Class:', user?.class);
        console.log('==========================');

        const userId = user?.id || user?.username || 'guest';

        // Chỉ lấy đúng các trường class, major, department từ user
        const name = user?.name || user?.fullName || user?.username || '';
        const className = user?.class || '';
        const major = user?.major || '';
        const department = user?.department || '';

        console.log('Calling getSubjects API...');
        const subjectsResp = await getSubjects();
        console.log('Student subjects API response (normalized):', subjectsResp);

        const subjectsData = subjectsResp.subjects || [];
        const studentInfoData = subjectsResp.studentInfo;
        const meta = subjectsResp.metadata || {};

        if (!Array.isArray(subjectsData) || subjectsData.length === 0) {
          setSubjects([]);
          setUserInfo({
            name: studentInfoData?.name || name,
            class: studentInfoData?.class || className,
            major: studentInfoData?.major || major,
            department: studentInfoData?.department || department,
            totalCompleted: 0,
            totalSubjects: 0,
            averageScore: 0,
            errorReason: meta.reason || 'no_schedule'
          });
          setLoading(false);
          return;
        }

        console.log('Calling getUserProgress API...');
        const progressData = await getUserProgress(userId).catch(err => {
          console.warn('Could not fetch user progress:', err);
          return {};
        });

        console.log('Progress data:', progressData);

        const localProgress = JSON.parse(localStorage.getItem('userProgress') || '{}');
        const combinedProgress = { ...progressData, ...(localProgress[userId] || {}) };

        console.log('Setting subjects data:', subjectsData.length, 'items');
        setSubjects(subjectsData);
        setUserProgress(combinedProgress);

        // Calculate completed subjects using both new API format and old progress data
        let completedCount = 0;
        let totalScore = 0;
        
        // Count completed subjects from the new API format
        const completedFromAPI = subjectsData.filter(subject => 
          subject.examStatus && subject.examStatus.taken && subject.examStatus.passed
        ).length;
        
        // Count completed subjects from the old progress data
        const completedFromProgress = Object.values(combinedProgress).filter(p => p.passed).length;
        
        // Use the higher value
        completedCount = Math.max(completedFromAPI, completedFromProgress);
        
        // Calculate total score from subjects with examStatus
        subjectsData.forEach(subject => {
          if (subject.examStatus && subject.examStatus.taken && subject.examStatus.score !== null && subject.examStatus.score !== undefined) {
            totalScore += Number(subject.examStatus.score) || 0;
          }
        });
        
        // Add scores from progress data if not already counted
        Object.values(combinedProgress).forEach(p => {
          if (p.bestScore !== null && p.bestScore !== undefined) {
            // Check if we've already counted this subject
            const alreadyCounted = subjectsData.some(subject => 
              subject.id === p.topicId && subject.examStatus && subject.examStatus.taken
            );
            
            if (!alreadyCounted) {
              totalScore += Number(p.bestScore) || 0;
            }
          }
        });
        
        // Ensure averageScore is never NaN
        const averageScore = (completedCount > 0 && totalScore > 0) ? Math.round(totalScore / completedCount) : 0;

        // Cập nhật userInfo từ dữ liệu thực tế hoặc từ API response nếu có
        if (studentInfoData) {
          // Sử dụng thông tin sinh viên từ API
          setUserInfo({
            name: studentInfoData.name || name,
            class: studentInfoData.class || className,
            major: studentInfoData.major || major,
            department: studentInfoData.department || department,
            totalCompleted: completedCount,
            totalSubjects: subjectsData.length,
            averageScore
          });
        } else {
          // Sử dụng thông tin từ user trong localStorage nếu không có trong API response
          setUserInfo({
            name,
            class: className,
            major,
            department,
            totalCompleted: completedCount,
            totalSubjects: subjectsData.length,
            averageScore
          });
        }

        setError(null);
      } catch (err) {
        console.error('Error fetching subjects data:', err);
        setError('Không thể tải dữ liệu từ server. Vui lòng liên hệ quản trị viên hoặc thử lại sau.');
        // Không sử dụng mock data, không setSubjects, setUserProgress, setUserInfo ở đây
      } finally {
        setLoading(false);
      }
    };
    
    // Chỉ gọi hàm fetchData khi user đã được xác thực
    if (user && user.id) {
      fetchData();
    }
  }, [user]); // Simplified dependency
  const getSubjectStatus = (subject) => {
    // First check if the subject has examStatus from the new API format
    if (subject.examStatus) {
      if (subject.examStatus.taken) {
        if (subject.examStatus.inProgress) {
          return 'in-progress'; // Đang làm bài (chưa nộp)
        }
        return subject.examStatus.passed ? 'completed' : 'failed';
      }
      return 'available'; // Chưa làm bao giờ
    }
    
    // Fallback to the old approach using userProgress
    const progress = userProgress[subject.id];
    
    if (!progress) {
      return 'available';
    }
    
    if (progress.passed) {
      return 'completed';
    }
    
    if (progress.attempts > 0) {
      return 'in-progress';
    }
    
    return 'available';
  };

  const isSubjectLocked = (subjectId) => {
    // Khóa chỉ khi đã pass (dựa vào examStatus hoặc progress)
    const subject = subjects.find(s => s.id === subjectId);
    if (subject && subject.examStatus && subject.examStatus.taken) {
      return subject.examStatus.passed === true; // pass => khóa
    }
    const prog = userProgress[subjectId];
    return prog?.passed === true;
  };

  const getSubjectScore = (subject) => {
    // First check if the subject has examStatus from the new API format
    if (subject.examStatus && subject.examStatus.taken) {
      const score = Number(subject.examStatus.score) || 0;
      return isNaN(score) ? 0 : score;
    }
    
    // Fallback to the old approach using userProgress
    const progress = userProgress[subject.id];
    if (progress && progress.bestScore !== null && progress.bestScore !== undefined) {
      const score = Number(progress.bestScore) || 0;
      return isNaN(score) ? 0 : score;
    }
    
    return 0;
  };

  const getSubjectAttempts = (subject) => {
    const progress = userProgress[subject.id];
    return progress ? progress.attempts : 0;
  };

  const getLastAttempt = (subject) => {
    const progress = userProgress[subject.id];
    if (!progress || !progress.lastAttempt) return null;
    
    const date = new Date(progress.lastAttempt);
    return date.toLocaleDateString('vi-VN');
  };

  const canStartQuiz = (subject) => {
    // Determine if the student can start the quiz based on subject status
    const status = getSubjectStatus(subject);
    
    // Allow if the subject is available, in-progress, or failed (can retake)
    return status === 'available' || status === 'in-progress' || status === 'failed';
  };

  const handleStartQuiz = async (subject) => {
    console.log('=== DEBUG START QUIZ ===');
    console.log('Subject:', subject);
    console.log('Subject ID:', subject.id);
    console.log('Can start quiz:', canStartQuiz(subject));
    console.log('Subject status:', getSubjectStatus(subject));
    console.log('Subject examStatus:', subject.examStatus);
    console.log('Total questions:', getSubjectQuestions(subject));
    
    // Get user information
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const studentDepartment = user.department || userInfo.department || 'Công nghệ thông tin'; // Use all available sources
    
    if (canStartQuiz(subject)) {
      try {
        // Verify question count before starting
        if (getSubjectQuestions(subject) === 0) {
          alert('Chuyên đề này chưa có câu hỏi. Vui lòng liên hệ giáo viên phụ trách.');
          return;
        }
        
        // Since the backend now handles schedule checking already, we can simplify this
        // We'll keep the canTakeQuiz check as an extra validation if needed
        const canAccess = await canTakeQuiz(subject.id).catch(err => {
          console.warn('Error checking quiz access, proceeding anyway:', err);
          return true; // Allow proceeding even if this check fails
        });
        
        if (!canAccess) {
          alert(`Không thể làm bài vào lúc này. Chuyên đề này chưa mở cho khoa ${studentDepartment}.`);
          return;
        }
        
        // Navigate to the quiz page
        console.log(`Navigating to quiz page for subject ID: ${subject.id}`);
        navigate(`/student/quiz/${subject.id}`);
      } catch (err) {
        console.error('Error starting quiz:', err);
        alert('Có lỗi xảy ra khi bắt đầu bài thi. Vui lòng thử lại sau.');
      }
    } else {
      alert('Chuyên đề này đã bị khóa hoặc bạn đã hoàn thành trước đó.');
    }
    
    console.log('=== DEBUG END ===');
  };

  const handleViewResult = (subject) => {
    // Check for result data in both the new API format and the old userProgress
    if (subject.examStatus && subject.examStatus.taken) {
      // Use the new API format
      alert(`Kết quả chi tiết:\nĐiểm cao nhất: ${subject.examStatus.score || 0}%\nTrạng thái: ${subject.examStatus.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}`);
      return;
    }
    
    // Fallback to the old format
    const progress = userProgress[subject.id];
    if (progress && progress.attempts > 0) {
      alert(`Kết quả chi tiết:\nĐiểm cao nhất: ${progress.bestScore}%\nSố lần làm: ${progress.attempts}\nTrạng thái: ${progress.passed ? 'ĐẠT' : 'CHƯA ĐẠT'}`);
    } else {
      alert('Không có thông tin kết quả cho chuyên đề này.');
    }
  };

  const handleLogout = async () => {
    try {
      console.log('Student logout button clicked');
      // Sử dụng logout function từ useAuth
      await logout();
      // Force navigate về login
      window.location.href = '/login';
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback: xóa manual
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('rememberLogin');
      window.location.href = '/login';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return { text: 'Đã hoàn thành', class: styles.completed };
      case 'failed':
        return { text: 'Không đạt', class: styles.failed };
      case 'in-progress':
        return { text: 'Đang thực hiện', class: styles.inProgress };
      case 'available':
        return { text: 'Có thể làm', class: styles.available };
      case 'locked':
        return { text: 'Chưa mở khóa', class: styles.locked };
      default:
        return { text: 'Không xác định', class: styles.unknown };
    }
  };

  const getProgressPercentage = () => {
    if (!userInfo.totalSubjects || userInfo.totalSubjects <= 0) {
      return 0;
    }
    const percentage = Math.round((userInfo.totalCompleted / userInfo.totalSubjects) * 100);
    return isNaN(percentage) ? 0 : percentage;
  };

  // Sửa lại các hàm lấy dữ liệu chuyên đề cho đúng từ backend
  const getSubjectQuestions = (subject) => {
    // Check all possible properties for question count
    return subject.totalQuestions ?? subject.actualQuestionCount ?? 0;
  };
  
  const getSubjectTimeLimit = (subject) => {
    // Check all possible properties for time limit
    return subject.duration_minutes !== undefined ? subject.duration_minutes : '--';
  };
  
  const getSubjectPassScore = (subject) => {
    // Check all possible properties for pass score
    return subject.pass_score !== undefined ? subject.pass_score : '--';
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
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>
              <i className="fas fa-graduation-cap"></i>
            </div>
            <div className={styles.headerText}>
              <h1>Hệ thống Trắc nghiệm</h1>
              <p>Sinh hoạt Công dân</p>
              {/* Hiển thị thông tin sinh viên: Tên - Lớp - Ngành - Khoa */}
              <div className={styles.userSummary}>
                {[userInfo.name, userInfo.class, userInfo.major, userInfo.department]
                  .filter(Boolean)
                  .join(' - ')}
              </div>
            </div>
          </div>
          <div className={styles.headerRight}>
            <div className={styles.userInfo}>
              <div className={styles.userAvatar}>
                <i className="fas fa-user"></i>
              </div>
              {/* Nếu đã hiển thị ở header, có thể bỏ userDetails hoặc chỉ hiển thị mã SV nếu cần */}
              {/* <div className={styles.userDetails}>
                <span className={styles.userId}>{userInfo.studentId}</span>
              </div> */}
            </div>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <i className="fas fa-sign-out-alt"></i>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* User Stats */}
        <section className={styles.statsSection}>
          <div className={styles.statsCard}>
            <div className={styles.statItem}>
              <div className={styles.statIcon}>
                <i className="fas fa-tasks"></i>
              </div>
              <div className={styles.statContent}>
                {/* Số chuyên đề hoàn thành/tổng chuyên đề */}
                <div className={styles.statNumber}>
                  {userInfo.totalCompleted}/{userInfo.totalSubjects}
                </div>
                <div className={styles.statLabel}>Chuyên đề hoàn thành</div>
              </div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statIcon}>
                <i className="fas fa-chart-line"></i>
              </div>
              <div className={styles.statContent}>
                {/* Tiến độ hoàn thành */}
                <div className={styles.statNumber}>
                  {getProgressPercentage()}%
                </div>
                <div className={styles.statLabel}>Tiến độ hoàn thành</div>
              </div>
            </div>
            <div className={styles.statItem}>
              <div className={styles.statIcon}>
                <i className="fas fa-star"></i>
              </div>
              <div className={styles.statContent}>
                {/* Điểm trung bình */}
                <div className={styles.statNumber}>
                  {(userInfo.averageScore && !isNaN(userInfo.averageScore)) ? userInfo.averageScore : 0}%
                </div>
                <div className={styles.statLabel}>Điểm trung bình</div>
              </div>
            </div>
          </div>
        </section>

        {/* Subjects List */}
        <section className={styles.subjectsSection}>
          <h2 className={styles.sectionTitle}>Danh sách chuyên đề</h2>
          <div className={styles.subjectsGrid}>
            {subjects.length === 0 ? (
              <div className={styles.emptyState}>
                <i className="fas fa-info-circle"></i>
                
                {/* Hiển thị thông báo phù hợp với lý do */}
                {userInfo.errorReason === 'missing_student_info' || userInfo.errorReason === 'missing_department' ? (
                  <p>Bạn cần cập nhật thông tin khoa/ngành/lớp để xem danh sách chuyên đề.</p>
                ) : userInfo.errorReason === 'no_schedules_for_department' ? (
                  <p>Hiện tại chưa có chuyên đề nào được xếp lịch cho khoa {userInfo.department || 'của bạn'}.</p>
                ) : (
                  <p>Hiện tại chưa có chuyên đề nào được xếp lịch cho khoa/ngành/lớp của bạn.</p>
                )}
                
                <div style={{ marginTop: '15px', fontSize: '14px', color: '#666', backgroundColor: '#f8f9fa', padding: '10px', borderRadius: '5px', borderLeft: '4px solid #dc3545' }}>
                  <p><strong>Thông tin sinh viên:</strong></p>
                  <p><strong>Họ tên:</strong> {userInfo.name || 'Chưa có thông tin'}</p>
                  <p><strong>Lớp:</strong> {userInfo.class || 'Chưa cập nhật'}</p>
                  <p><strong>Ngành:</strong> {userInfo.major || 'Chưa cập nhật'}</p>
                  <p><strong>Khoa:</strong> {userInfo.department || 'Chưa cập nhật'}</p>
                </div>
                
                <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px', borderLeft: '4px solid #007bff' }}>
                  <p style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '16px' }}>Nguyên nhân và hướng giải quyết:</p>
                  
                  {userInfo.errorReason === 'missing_student_info' || userInfo.errorReason === 'missing_department' ? (
                    <ul style={{ marginLeft: '20px', textAlign: 'left' }}>
                      <li style={{ marginBottom: '8px' }}>Thông tin khoa/ngành/lớp của bạn <strong>chưa được cập nhật</strong> trong hệ thống</li>
                      <li style={{ marginBottom: '8px' }}>Hệ thống cần thông tin này để xác định lịch thi phù hợp với bạn</li>
                      <li style={{ marginBottom: '8px' }}>Vui lòng liên hệ giáo viên phụ trách hoặc phòng đào tạo để cập nhật thông tin</li>
                    </ul>
                  ) : userInfo.errorReason === 'no_schedules_for_department' ? (
                    <ul style={{ marginLeft: '20px', textAlign: 'left' }}>
                      <li style={{ marginBottom: '8px' }}>Khoa của bạn <strong>chưa được xếp lịch thi</strong> cho bất kỳ chuyên đề nào</li>
                      <li style={{ marginBottom: '8px' }}>Lịch thi sẽ được cập nhật khi có thông báo từ phòng đào tạo</li>
                      <li style={{ marginBottom: '8px' }}>Vui lòng kiểm tra lại sau hoặc liên hệ giáo viên phụ trách để biết thêm chi tiết</li>
                    </ul>
                  ) : (
                    <ul style={{ marginLeft: '20px', textAlign: 'left' }}>
                      <li style={{ marginBottom: '8px' }}>Chưa có lịch thi được xếp cho khoa/ngành/lớp của bạn</li>
                      <li style={{ marginBottom: '8px' }}>Thông tin khoa/ngành/lớp của bạn có thể chưa đúng hoặc không khớp với lịch thi</li>
                      <li style={{ marginBottom: '8px' }}>Chưa có chuyên đề nào được tạo trong hệ thống</li>
                      <li style={{ marginBottom: '8px' }}>Có sự cố kết nối với máy chủ</li>
                    </ul>
                  )}
                  
                  <p style={{ marginTop: '15px', fontWeight: 'bold' }}>
                    Vui lòng liên hệ giáo viên phụ trách để được hỗ trợ.
                  </p>
                </div>
                
                <button 
                  style={{ 
                    marginTop: '15px', 
                    padding: '8px 16px', 
                    background: '#007bff', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                  onClick={() => window.location.reload()}
                >
                  Tải lại trang
                </button>
              </div>
            ) : (
              subjects.map((subject) => {
                const status = getSubjectStatus(subject);
                const score = getSubjectScore(subject);
                const attempts = getSubjectAttempts(subject);
                const lastAttempt = getLastAttempt(subject);
                const statusBadge = getStatusBadge(status);
                const locked = isSubjectLocked(subject.id);

                return (
                  <div key={subject.id} className={`${styles.subjectCard} ${styles[status]} ${locked ? styles.locked : ''}`}>
                    <div className={styles.cardHeader}>
                      <div className={styles.subjectNumber}>
                        Chuyên đề {subject.id}
                      </div>
                      <div className={`${styles.statusBadge} ${statusBadge.class}`}>
                        {statusBadge.text}
                      </div>
                    </div>

                    <div className={styles.cardContent}>
                      <h3 className={styles.subjectTitle}>{subject.name}</h3>
                      <p className={styles.subjectDescription}>{subject.description}</p>

                      <div className={styles.subjectMeta}>
                        <div className={styles.metaItem}>
                          <i className="fas fa-question-circle"></i>
                          <span>{getSubjectQuestions(subject)} câu hỏi</span>
                        </div>
                        <div className={styles.metaItem}>
                          <i className="fas fa-clock"></i>
                          <span>{getSubjectTimeLimit(subject)} phút</span>
                        </div>
                        <div className={styles.metaItem}>
                          <i className="fas fa-target"></i>
                          <span>Qua môn: {getSubjectPassScore(subject)}%</span>
                        </div>
                      </div>

                      {attempts > 0 && (
                        <div className={styles.progressInfo}>
                          <div className={styles.scoreInfo}>
                            <span className={styles.scoreLabel}>Điểm cao nhất:</span>
                            <span className={`${styles.scoreValue} ${score >= getSubjectPassScore(subject) ? styles.passed : styles.failed}`}>
                              {score}%
                            </span>
                          </div>
                          <div className={styles.attemptInfo}>
                            <span>Số lần làm: {attempts}</span>
                            {lastAttempt && <span>Lần cuối: {lastAttempt}</span>}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={styles.cardActions}>
                      {locked ? (
                        <button className={styles.lockedBtn} disabled>
                          <i className="fas fa-lock"></i>
                          Đã hoàn thành
                        </button>
                      ) : status === 'completed' ? (
                        <div className={styles.actionGroup}>
                          <button 
                            className={styles.viewResultBtn}
                            onClick={() => handleViewResult(subject)}
                          >
                            <i className="fas fa-chart-bar"></i>
                            Xem kết quả
                          </button>
                          <button 
                            className={styles.retakeBtn}
                            onClick={() => handleStartQuiz(subject)}
                          >
                            <i className="fas fa-redo"></i>
                            Làm lại
                          </button>
                        </div>
                      ) : status === 'failed' ? (
                        <div className={styles.actionGroup}>
                          <button 
                            className={styles.viewResultBtn}
                            onClick={() => handleViewResult(subject)}
                          >
                            <i className="fas fa-chart-bar"></i>
                            Xem kết quả
                          </button>
                          <button 
                            className={styles.retakeBtn}
                            onClick={() => handleStartQuiz(subject)}
                          >
                            <i className="fas fa-redo"></i>
                            Làm lại
                          </button>
                        </div>
                      ) : status === 'in-progress' ? (
                        <button 
                          className={styles.continueBtn}
                          onClick={() => handleStartQuiz(subject)}
                        >
                          <i className="fas fa-play-circle"></i>
                          Tiếp tục
                        </button>
                      ) : status === 'available' ? (
                        <button 
                          className={styles.startBtn}
                          onClick={() => handleStartQuiz(subject)}
                        >
                          <i className="fas fa-play"></i>
                          Bắt đầu làm bài
                        </button>
                      ) : (
                        <button className={styles.lockedBtn} disabled>
                          <i className="fas fa-lock"></i>
                          Chưa mở khóa
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default TopicListPage;