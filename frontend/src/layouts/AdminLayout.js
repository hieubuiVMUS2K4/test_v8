import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './AdminLayout.css';

const AdminLayout = ({ children, title }) => {
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
  };

  return (
    <div className="admin-layout">
      <nav className="admin-sidebar">
        <div className="sidebar-header">
          <h3>Admin Panel</h3>
        </div>
        
        <div className="sidebar-menu">
          <Link to="/admin" className="menu-item">
            📊 Dashboard
          </Link>
          <Link to="/admin/subjects" className="menu-item">
            📚 Quản lý chủ đề
          </Link>
          <Link to="/admin/schedules" className="menu-item">
            🗓️ Quản lý lịch thi
          </Link>
          <Link to="/admin/students" className="menu-item">
            👥 Quản lý sinh viên
          </Link>
          <Link to="/admin/structure" className="menu-item">
            🏢 Quản lý khoa/ngành/lớp
          </Link>
          <Link to="/admin/reports" className="menu-item">
            📈 Báo cáo
          </Link>
        </div>
        
        <div className="sidebar-footer">
          <div className="user-info">
            <p>👤 {user?.full_name || user?.username}</p>
            <button onClick={handleLogout} className="logout-btn">
              Đăng xuất
            </button>
          </div>
        </div>
      </nav>
      
      <div className="admin-main">
        <header className="admin-header">
          <div className="header-left">
            <div className="system-info">
              <h1>Admin Dashboard</h1>
              <p className="system-subtitle">Hệ thống Quản lý Trắc nghiệm Sinh hoạt Công dân</p>
            </div>
          </div>
          
          <div className="header-right">
            <div className="admin-info">
              <div className="admin-details">
                <span className="admin-label">Admin System</span>
                <span className="admin-name">👤 {user?.full_name || user?.username}</span>
                <span className="admin-role">Quản trị viên</span>
              </div>
              <button onClick={handleLogout} className="header-logout-btn">
                🚪 Đăng xuất
              </button>
            </div>
          </div>
        </header>
        
        <main className="admin-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
