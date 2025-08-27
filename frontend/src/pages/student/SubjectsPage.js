import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './ExamResultPage.module.css';

// Thêm các hàm gọi API riêng cho sinh viên
const fetchStudentSubjects = async () => {
  // Gọi API lấy danh sách chuyên đề theo lịch cho sinh viên
  const res = await fetch('/api/student/subjects', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  const data = await res.json();
  // Nếu có subjects và length > 0 thì trả về, nếu không thì trả về []
  if (data.success && Array.isArray(data.subjects) && data.subjects.length > 0) {
    return data.subjects;
  }
  return []; // Không có chuyên đề nào
};

const fetchStudentProgress = async () => {
  // Gọi API lấy tiến độ chuyên đề của sinh viên
  const res = await fetch('/api/student/progress', {
    headers: {
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    }
  });
  const data = await res.json();
  if (data.success && typeof data.progress === 'object') {
    return data.progress;
  }
  throw new Error(data.message || 'Không thể lấy tiến độ chuyên đề');
};

const SubjectsPage = () => {
  const [user, setUser] = useState(null);
  const [studentSubjects, setStudentSubjects] = useState([]); // Danh sách chuyên đề cho sinh viên, tách biệt admin
  const [progress, setProgress] = useState({});
  const [noSchedule, setNoSchedule] = useState(false);
  const [stats, setStats] = useState({
    passedTopics: 0,
    totalAttempts: 0,
    avgScore: 0,
    overallStatus: 'Chưa hoàn thành'
  });
  const navigate = useNavigate();

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
  }, [navigate]);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Chỉ lấy chuyên đề cho sinh viên từ API riêng
        const [subjectsData, progressData] = await Promise.all([
          fetchStudentSubjects(),
          fetchStudentProgress()
        ]);
        setStudentSubjects(subjectsData);
        setProgress(progressData);
        setNoSchedule(subjectsData.length === 0);
      } catch (err) {
        setNoSchedule(true);
        setStudentSubjects([]);
        setProgress({});
        console.error('Error loading data:', err);
      }
    };
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (studentSubjects.length > 0) {
      loadUserStats();
    } else {
      setStats({
        passedTopics: 0,
        totalAttempts: 0,
        avgScore: 0,
        overallStatus: 'Chưa hoàn thành'
      });
    }
  }, [studentSubjects, progress]);

  const loadUserStats = () => {
    let totalAttempts = 0;
    let totalScore = 0;
    let passedCount = 0;
    let hasScores = false;
    studentSubjects.forEach((subject) => {
      const subjProgress = progress[subject.id] || {};
      totalAttempts += subjProgress.attempts || 0;
      if (subjProgress.bestScore > 0) {
        totalScore += subjProgress.bestScore;
        hasScores = true;
      }
      if (subjProgress.passed) passedCount++;
    });
    const avgScore = hasScores && studentSubjects.length > 0 ? Math.round(totalScore / studentSubjects.length) : 0;
    const overallStatus = passedCount === studentSubjects.length ? 'Hoàn thành' :
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
            {noSchedule ? (
              <div className={styles.emptyState}>
                <i className="fas fa-info-circle"></i>
                Hiện tại chưa có chuyên đề nào dành cho bạn
              </div>
            ) : (
              studentSubjects.length === 0 ? (
                <div className={styles.emptyState}>
                  <i className="fas fa-info-circle"></i>
                  Hiện tại chưa có chuyên đề nào dành cho bạn
                </div>
              ) : (
                studentSubjects.map((subject) => {
                  const subjProgress = progress[subject.id] || {};
                  return (
                    <div key={subject.id} className={styles.subjectCard}>
                      <div className={styles.cardHeader}>
                        <h3>Chuyên đề {subject.id}</h3>
                        <span className={`${styles.status} ${getStatusColor(subjProgress)}`}>
                          {getStatusText(subjProgress)}
                        </span>
                      </div>
                      <p className={styles.subjectTitle}>{subject.name}</p>
                      <div className={styles.subjectStats}>
                        {subjProgress.bestScore > 0 && (
                          <div className={styles.statItem}>
                            <span>Điểm gần nhất / cao nhất:</span>
                            <strong className={subjProgress.passed ? styles.passScore : styles.failScore}>
                              {subjProgress.bestScore}%
                            </strong>
                          </div>
                        )}
                        <div className={styles.statItem}>
                          <span>Số câu hỏi:</span>
                          <strong>{subject.totalQuestions} câu (Qua môn: {subject.pass_score}%)</strong>
                        </div>
                      </div>
                      <div className={styles.cardActions}>
                        <button
                          onClick={() => handleViewResults(subject.id)}
                          className={styles.secondaryBtn}
                          disabled={!subjProgress.bestScore && !subjProgress.passed}
                        >
                          <i className="fas fa-chart-line"></i>
                          Kết quả
                        </button>
                        <button
                          onClick={() => handleStartQuiz(subject.id)}
                          className={styles.primaryBtn}
                          disabled={subjProgress.passed}
                        >
                          <i className="fas fa-play"></i>
                          {subjProgress.passed ? 'Đã đạt' : (subjProgress.bestScore ? 'Làm lại' : 'Bắt đầu')}
                        </button>
                      </div>
                      {/* Bỏ giới hạn số lần làm */}
                    </div>
                  );
                })
              )
            )}
          </div>
        </section>
      </main>
    </div>
  );
};

export default SubjectsPage;