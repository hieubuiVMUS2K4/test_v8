// src/pages/SubjectsPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ExamResultPage.module.css';

const SubjectsPage = () => {
  const [user, setUser] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [stats, setStats] = useState({
    passedTopics: 0,
    totalAttempts: 0,
    avgScore: 0,
    overallStatus: 'Chưa hoàn thành'
  });
  const navigate = useNavigate();

  const subjectsList = [
    "Tư tưởng Hồ Chí Minh về độc lập dân tộc",
    "Đường lối cách mạng của Đảng Cộng sản Việt Nam", 
    "Chủ nghĩa xã hội và con đường đi lên CNXH ở VN",
    "Đổi mới tư duy kinh tế",
    "Xây dựng nhà nước pháp quyền XHCN",
    "Đại đoàn kết toàn dân tộc",
    "Văn hóa và con người Việt Nam",
    "Quốc phòng an ninh trong thời kỳ mới",
    "Đối ngoại và hội nhập quốc tế"
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/login');
      return;
    }
    
    const parsedUser = JSON.parse(userData);
    if (parsedUser.type !== 'student') {
      navigate('/login');
      return;
    }
    
    setUser(parsedUser);
    initializeSubjects();
    loadUserStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  const initializeSubjects = () => {
    const subjectsData = subjectsList.map((title, index) => {
      const savedData = localStorage.getItem(`subject_${index}`) || '{}';
      const subjectData = JSON.parse(savedData);
      
      return {
        id: index,
        title,
        attempts: subjectData.attempts || 0,
        bestScore: subjectData.bestScore || 0,
        passed: subjectData.passed || false,
        lastAttempt: subjectData.lastAttempt || null
      };
    });
    
    setSubjects(subjectsData);
  };

  const loadUserStats = () => {
    let totalAttempts = 0;
    let totalScore = 0;
    let passedCount = 0;
    let hasScores = false;

    subjectsList.forEach((_, index) => {
      const savedData = localStorage.getItem(`subject_${index}`);
      if (savedData) {
        const data = JSON.parse(savedData);
        totalAttempts += data.attempts || 0;
        if (data.bestScore > 0) {
          totalScore += data.bestScore;
          hasScores = true;
        }
        if (data.passed) passedCount++;
      }
    });

    const avgScore = hasScores ? Math.round(totalScore / subjectsList.length) : 0;
    const overallStatus = passedCount === 9 ? 'Hoàn thành' : 
                         passedCount > 0 ? 'Đang thực hiện' : 'Chưa bắt đầu';

    setStats({
      passedTopics: passedCount,
      totalAttempts,
      avgScore,
      overallStatus
    });
  };

  const handleStartQuiz = (subjectId) => {
    navigate(`/quiz/${subjectId}`);
  };

  const handleViewResults = (subjectId) => {
    navigate(`/subject-result/${subjectId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getStatusColor = (subject) => {
    if (subject.passed) return styles.passed;
    if (subject.attempts > 0) return styles.inProgress;
    return styles.notStarted;
  };

  const getStatusText = (subject) => {
    if (subject.passed) return 'Đã Pass';
    if (subject.attempts > 0) return 'Đang thực hiện';
    return 'Chưa bắt đầu';
  };

  if (!user) return <div className={styles.loading}>Đang tải...</div>;

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            <div className={styles.logo}>⚓</div>
            <div className={styles.headerText}>
              <h1>Hệ thống Trắc nghiệm</h1>
              <p>Tuần Sinh hoạt Công dân - Sinh viên Hàng Hải</p>
            </div>
          </div>
          <div className={styles.headerRight}>
            <span className={styles.userInfo}>
              Xin chào, {user.name} ({user.id})
            </span>
            <button onClick={handleLogout} className={styles.logoutBtn}>
              <i className="fas fa-sign-out-alt"></i>
              Đăng xuất
            </button>
          </div>
        </div>
      </header>

      <main className={styles.main}>
        {/* Stats Overview */}
        <section className={styles.statsSection}>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon + ' ' + styles.greenIcon}>
                <i className="fas fa-check-circle"></i>
              </div>
              <div className={styles.statContent}>
                <p>Chuyên đề đã Pass</p>
                <span className={styles.statNumber + ' ' + styles.green}>
                  {stats.passedTopics}/9
                </span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon + ' ' + styles.blueIcon}>
                <i className="fas fa-tasks"></i>
              </div>
              <div className={styles.statContent}>
                <p>Tổng bài làm</p>
                <span className={styles.statNumber + ' ' + styles.blue}>
                  {stats.totalAttempts}
                </span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon + ' ' + styles.yellowIcon}>
                <i className="fas fa-percentage"></i>
              </div>
              <div className={styles.statContent}>
                <p>Điểm trung bình</p>
                <span className={styles.statNumber + ' ' + styles.yellow}>
                  {stats.avgScore}%
                </span>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon + ' ' + styles.purpleIcon}>
                <i className="fas fa-trophy"></i>
              </div>
              <div className={styles.statContent}>
                <p>Trạng thái</p>
                <span className={styles.statNumber + ' ' + styles.purple}>
                  {stats.overallStatus}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Subjects Grid */}
        <section className={styles.subjectsSection}>
          <div className={styles.sectionHeader}>
            <h2>9 Chuyên đề Sinh hoạt Công dân</h2>
            <div className={styles.quickActions}>
              <button 
                onClick={() => navigate('/history')}
                className={styles.actionBtn}
              >
                <i className="fas fa-history"></i>
                Lịch sử làm bài
              </button>
              <button 
                onClick={() => navigate('/profile')}
                className={styles.actionBtn}
              >
                <i className="fas fa-user"></i>
                Thông tin cá nhân
              </button>
            </div>
          </div>

          <div className={styles.subjectsGrid}>
            {subjects.map((subject) => (
              <div key={subject.id} className={styles.subjectCard}>
                <div className={styles.cardHeader}>
                  <h3>Chuyên đề {subject.id + 1}</h3>
                  <span className={`${styles.status} ${getStatusColor(subject)}`}>
                    {getStatusText(subject)}
                  </span>
                </div>

                <p className={styles.subjectTitle}>{subject.title}</p>

                <div className={styles.subjectStats}>
                  <div className={styles.statItem}>
                    <span>Số lần làm:</span>
                    <strong>{subject.attempts}/3</strong>
                  </div>
                  {subject.bestScore > 0 && (
                    <div className={styles.statItem}>
                      <span>Điểm cao nhất:</span>
                      <strong className={subject.passed ? styles.passScore : styles.failScore}>
                        {subject.bestScore}%
                      </strong>
                    </div>
                  )}
                  <div className={styles.statItem}>
                    <span>Yêu cầu:</span>
                    <strong>{subject.totalQuestions || subject.questionCount || '...'} câu - {subject.passScore || 0}% để Pass</strong>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  {subject.attempts > 0 && (
                    <button 
                      onClick={() => handleViewResults(subject.id)}
                      className={styles.secondaryBtn}
                    >
                      <i className="fas fa-chart-line"></i>
                      Xem kết quả
                    </button>
                  )}
                  
                  <button 
                    onClick={() => handleStartQuiz(subject.id)}
                    className={styles.primaryBtn}
                    disabled={subject.attempts >= 3 && !subject.passed}
                  >
                    <i className="fas fa-play"></i>
                    {subject.attempts === 0 ? 'Bắt đầu' : 
                     subject.passed ? 'Làm lại' : 'Thử lại'}
                  </button>
                </div>

                {subject.attempts >= 3 && !subject.passed && (
                  <div className={styles.limitWarning}>
                    <i className="fas fa-exclamation-triangle"></i>
                    Đã hết lượt làm bài
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SubjectsPage;