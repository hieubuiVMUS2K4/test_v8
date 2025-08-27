// src/pages/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getDashboardData } from '../../services/apiService';
// import { useAuth } from '../../hooks/useAuth'; // Tạm thời comment để test
import styles from './DashboardPage.module.css';

const AdminDashBoard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    completedStudents: 0,
    inProgressStudents: 0,
    notStartedStudents: 0
  });
  
  const [recentActivities, setRecentActivities] = useState([]);
  const [topicProgress, setTopicProgress] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();
  // const { logout } = useAuth(); // Tạm thời comment để test

  useEffect(() => {
    // Đặt thông tin người dùng admin vào localStorage khi trang được tải
    const setAdminUser = () => {
      const currentUser = localStorage.getItem('user');
      if (!currentUser) {
        const adminUser = {
          id: 'admin123',
          username: 'admin',
          type: 'admin',
          name: 'Admin System'
        };
        localStorage.setItem('user', JSON.stringify(adminUser));
      }
    };

    setAdminUser();
    
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await getDashboardData();
        
        // Xử lý dữ liệu trả về an toàn
        if (data && data.stats) {
          setStats(data.stats);
        } else {
          // Sử dụng dữ liệu mặc định nếu API không trả về đúng format
          setStats({
            totalStudents: 0,
            completedStudents: 0,
            inProgressStudents: 0,
            notStartedStudents: 0
          });
        }
        
        if (data && data.recentActivities) {
          // Chỉ giữ tối đa 10 hoạt động gần đây để tiết kiệm bộ nhớ
          setRecentActivities(Array.isArray(data.recentActivities) ? data.recentActivities.slice(0, 10) : []);
        } else {
          setRecentActivities([]);
        }
        
        if (data && data.topicProgress) {
          setTopicProgress(data.topicProgress);
        } else {
          setTopicProgress([]);
        }
        
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Không thể tải dữ liệu dashboard. Vui lòng thử lại sau.');
        // Sử dụng dữ liệu trống khi có lỗi thay vì dữ liệu giả
        setStats({
          totalStudents: 0,
          completedStudents: 0,
          inProgressStudents: 0,
          notStartedStudents: 0
        });
        setRecentActivities([]);
        setTopicProgress([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getCompletionPercentage = () => {
    if (!stats || !stats.totalStudents || stats.totalStudents === 0) {
      return 0;
    }
    return Math.round((stats.completedStudents / stats.totalStudents) * 100);
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'success': return 'fas fa-check-circle';
      case 'warning': return 'fas fa-redo';
      case 'info': return 'fas fa-info-circle';
      default: return 'fas fa-circle';
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
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Thử lại</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        {/* Stats Overview */}
        <section className={styles.statsSection}>
          <h2 className={styles.sectionTitle}>Tổng quan hệ thống</h2>
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <div className={styles.statIcon + ' ' + styles.blueIcon}>
                <i className="fas fa-users"></i>
              </div>
              <div className={styles.statContent}>
                <h3>Tổng sinh viên</h3>
                <div className={styles.statNumber}>{(stats?.totalStudents || 0).toLocaleString()}</div>
                <p className={styles.statDescription}>Đã đăng ký hệ thống</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon + ' ' + styles.greenIcon}>
                <i className="fas fa-check-circle"></i>
              </div>
              <div className={styles.statContent}>
                <h3>Đã hoàn thành</h3>
                <div className={styles.statNumber}>{(stats?.completedStudents || 0).toLocaleString()}</div>
                <p className={styles.statDescription}>{getCompletionPercentage()}% tổng số</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon + ' ' + styles.yellowIcon}>
                <i className="fas fa-clock"></i>
              </div>
              <div className={styles.statContent}>
                <h3>Đang thực hiện</h3>
                <div className={styles.statNumber}>{(stats?.inProgressStudents || 0).toLocaleString()}</div>
                <p className={styles.statDescription}>Đang làm bài</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon + ' ' + styles.redIcon}>
                <i className="fas fa-exclamation-triangle"></i>
              </div>
              <div className={styles.statContent}>
                <h3>Chưa bắt đầu</h3>
                <div className={styles.statNumber}>{(stats?.notStartedStudents || 0).toLocaleString()}</div>
                <p className={styles.statDescription}>Cần theo dõi</p>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className={styles.contentGrid}>
          {/* Topic Progress */}
          <section className={styles.progressSection}>
            <h3 className={styles.cardTitle}>Tiến độ theo chuyên đề</h3>
            <div className={styles.progressList}>
              {(topicProgress || []).map((topic) => (
                <div key={topic.id} className={styles.progressItem}>
                  <div className={styles.progressHeader}>
                    <span className={styles.topicName}>{topic.name}</span>
                    <span className={styles.progressPercent}>{topic.completed}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${topic.completed}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Recent Activities */}
          <section className={styles.activitySection}>
            <h3 className={styles.cardTitle}>Hoạt động gần đây</h3>
            <div className={styles.activityList}>
              {(recentActivities || []).map((activity) => (
                <div key={activity.id} className={styles.activityItem}>
                  <div className={`${styles.activityIcon} ${styles[activity.type]}`}>
                    <i className={getActivityIcon(activity.type)}></i>
                  </div>
                  <div className={styles.activityContent}>
                    <div className={styles.activityText}>
                      <strong>{activity.student}</strong> {activity.action}
                    </div>
                    <div className={styles.activityTime}>{activity.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Quick Actions */}
        <section className={styles.actionsSection}>
          <h3 className={styles.sectionTitle}>Thao tác nhanh</h3>
          <div className={styles.actionsGrid}>
            <button 
              className={styles.actionCard}
              onClick={() => navigate('/admin/students')}
            >
              <div className={styles.actionIcon}>
                <i className="fas fa-users-cog"></i>
              </div>
              <div className={styles.actionContent}>
                <h4>Quản lý sinh viên</h4>
                <p>Xem danh sách và quản lý tài khoản sinh viên</p>
              </div>
            </button>

            <button 
              className={styles.actionCard}
              onClick={() => navigate('/admin/subjects')}
            >
              <div className={styles.actionIcon}>
                <i className="fas fa-tasks"></i>
              </div>
              <div className={styles.actionContent}>
                <h4>Quản lý chuyên đề</h4>
                <p>Chỉnh sửa câu hỏi và nội dung bài thi</p>
              </div>
            </button>

            <button 
              className={styles.actionCard}
              onClick={() => navigate('/admin/reports')}
            >
              <div className={styles.actionIcon}>
                <i className="fas fa-chart-bar"></i>
              </div>
              <div className={styles.actionContent}>
                <h4>Báo cáo kết quả</h4>
                <p>Xem thống kê và xuất báo cáo chi tiết</p>
              </div>
            </button>

            <button className={styles.actionCard}>
              <div className={styles.actionIcon}>
                <i className="fas fa-download"></i>
              </div>
              <div className={styles.actionContent}>
                <h4>Xuất dữ liệu</h4>
                <p>Tải xuống báo cáo Excel và PDF</p>
              </div>
            </button>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AdminDashBoard;