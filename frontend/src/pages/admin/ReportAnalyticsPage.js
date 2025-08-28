import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import reportService from '../../services/reportService';
import { exportExamStatistics, exportDetailedReport } from '../../utils/exportExcel';
import styles from './ReportAnalyticsPage.module.css';

const ReportAnalyticsPage = () => {
  const navigate = useNavigate();
  const [statistics, setStatistics] = useState(null);
  const [detailedReports, setDetailedReports] = useState([]);
  const [filterOptions, setFilterOptions] = useState({
    topics: [],
    departments: [],
    majors: []
  });
  const [filters, setFilters] = useState({
    topicId: '',
    departmentId: '',
    majorId: '',
    startDate: '',
    endDate: ''
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  // Pagination for detailed reports
  const [detailPage, setDetailPage] = useState(1);
  const pageSize = 10; // records per page

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [statsResponse, filtersResponse] = await Promise.all([
        reportService.getExamStatistics(),
        reportService.getFilterOptions()
      ]);
      
      setStatistics(statsResponse.data);
      setFilterOptions(filtersResponse.data);
    } catch (error) {
      console.error('Error loading initial data:', error);
      alert('Lỗi khi tải dữ liệu báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const applyFilters = async () => {
    setLoading(true);
    try {
      const response = await reportService.getDetailedReport(filters);
      setDetailedReports(response.data.reports);
      setActiveTab('detailed');
  setDetailPage(1); // reset to first page when filters applied
    } catch (error) {
      console.error('Error applying filters:', error);
      alert('Lỗi khi lọc dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const handleExportStatistics = async () => {
    try {
      await exportExamStatistics(statistics);
      alert('Xuất báo cáo thống kê thành công!');
    } catch (error) {
      console.error('Error exporting statistics:', error);
      alert('Lỗi khi xuất báo cáo thống kê');
    }
  };

  const handleExportDetailed = async () => {
    try {
      if (detailedReports.length === 0) {
        alert('Không có dữ liệu để xuất. Vui lòng áp dụng bộ lọc trước.');
        return;
      }
      await exportDetailedReport(detailedReports);
      alert('Xuất báo cáo chi tiết thành công!');
    } catch (error) {
      console.error('Error exporting detailed report:', error);
      alert('Lỗi khi xuất báo cáo chi tiết');
    }
  };

  const handleBackToAdmin = () => {
    navigate('/admin');
  };

  if (loading && !statistics) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <p>Đang tải dữ liệu báo cáo...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      {/* Header with Back button */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button 
            className={styles.backBtn}
            onClick={handleBackToAdmin}
          >
            ← Quay lại Admin
          </button>
        </div>
        <h1 className={styles.title}>Báo cáo & Phân tích</h1>
        <div className={styles.headerRight}></div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabs}>
        <button 
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Tổng quan
        </button>
        <button 
          className={`${styles.tab} ${activeTab === 'detailed' ? styles.active : ''}`}
          onClick={() => setActiveTab('detailed')}
        >
          Báo cáo chi tiết
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && statistics && (
        <div className={styles.overviewTab}>
          {/* Key Statistics Cards */}
          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <h3>Tổng sinh viên tham gia</h3>
              <div className={styles.statNumber}>{statistics.overview.studentsWithExams}</div>
            </div>
            <div className={styles.statCard}>
              <h3>Số sinh viên đạt</h3>
              <div className={styles.statNumber}>{statistics.overview.passedStudents}</div>
            </div>
            <div className={styles.statCard}>
              <h3>Số sinh viên không đạt</h3>
              <div className={styles.statNumber}>{statistics.overview.failedStudents}</div>
            </div>
            <div className={styles.statCard}>
              <h3>Tỷ lệ đạt</h3>
              <div className={styles.statNumber}>{statistics.overview.passRate}%</div>
            </div>
          </div>

          {/* Student Statistics */}
          <div className={styles.section}>
            <h2>Thống kê theo sinh viên</h2>
            <p className={styles.note}>
              <strong>Tiêu chí đạt:</strong> Điểm số ≥ 80% (thay vì điểm đạt của từng chuyên đề)
            </p>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Mã sinh viên</th>
                    <th>Họ tên</th>
                    <th>Lớp</th>
                    <th>Ngành</th>
                    <th>Tổng lượt thi</th>
                    <th>Đạt (≥80%)</th>
                    <th>Không đạt (&lt;80%)</th>
                    <th>Điểm TB</th>
                    <th>Cao nhất</th>
                    <th>Thấp nhất</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.studentStatistics ? statistics.studentStatistics.map(student => (
                    <tr key={student.id}>
                      <td>{student.student_code}</td>
                      <td>{student.student_name}</td>
                      <td>{student.class_name}</td>
                      <td>{student.major_name}</td>
                      <td>{student.total_attempts}</td>
                      <td className={styles.passed}>{student.passed_count}</td>
                      <td className={styles.failed}>{student.failed_count}</td>
                      <td>{student.average_score || 0}</td>
                      <td>{student.highest_score || 0}</td>
                      <td>{student.lowest_score || 0}</td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="10">Không có dữ liệu thống kê sinh viên</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Department Statistics */}
          <div className={styles.section}>
            <h2>Thống kê theo khoa/ngành</h2>
            <p className={styles.note}>
              <strong>Lưu ý:</strong> Sinh viên chỉ được tính "Đạt" khi hoàn thành TẤT CẢ chuyên đề và mỗi chuyên đề đạt ≥ 80%
            </p>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Khoa</th>
                    <th>Ngành</th>
                    <th>Tổng SV</th>
                    <th>SV đạt</th>
                    <th>SV không đạt</th>
                    <th>Điểm TB</th>
                  </tr>
                </thead>
                <tbody>
                  {statistics.departmentStatistics.map((dept, index) => (
                    <tr key={index}>
                      <td>{dept.department_name}</td>
                      <td>{dept.major_name}</td>
                      <td>{dept.total_students}</td>
                      <td className={styles.passed}>{dept.passed_students || 0}</td>
                      <td className={styles.failed}>{dept.failed_students || 0}</td>
                      <td>{dept.average_score || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Export Button */}
          <div className={styles.actions}>
            <button 
              className={styles.exportBtn}
              onClick={handleExportStatistics}
            >
              📊 Xuất thống kê Excel
            </button>
          </div>
        </div>
      )}

      {/* Detailed Tab */}
      {activeTab === 'detailed' && (
        <div className={styles.detailedTab}>
          {/* Filters */}
          <div className={styles.filtersSection}>
            <h2>Bộ lọc</h2>
            <div className={styles.filtersGrid}>
              <div className={styles.filterGroup}>
                <label>Chuyên đề:</label>
                <select 
                  value={filters.topicId} 
                  onChange={(e) => handleFilterChange('topicId', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {filterOptions.topics.map(topic => (
                    <option key={topic.id} value={topic.id}>{topic.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Khoa:</label>
                <select 
                  value={filters.departmentId} 
                  onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {filterOptions.departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Ngành:</label>
                <select 
                  value={filters.majorId} 
                  onChange={(e) => handleFilterChange('majorId', e.target.value)}
                >
                  <option value="">Tất cả</option>
                  {filterOptions.majors
                    .filter(major => !filters.departmentId || major.department_id === parseInt(filters.departmentId))
                    .map(major => (
                      <option key={major.id} value={major.id}>{major.name}</option>
                    ))}
                </select>
              </div>

              <div className={styles.filterGroup}>
                <label>Từ ngày:</label>
                <input 
                  type="date" 
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                />
              </div>

              <div className={styles.filterGroup}>
                <label>Đến ngày:</label>
                <input 
                  type="date" 
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                />
              </div>

              <div className={styles.filterActions}>
                <button 
                  className={styles.applyBtn}
                  onClick={applyFilters}
                  disabled={loading}
                >
                  {loading ? 'Đang lọc...' : 'Áp dụng'}
                </button>
              </div>
            </div>
          </div>

          {/* Detailed Results */}
          {detailedReports.length > 0 && (
            <div className={styles.section}>
              <div className={styles.sectionHeader}>
                <h2>Kết quả chi tiết ({detailedReports.length} bản ghi)</h2>
                <button 
                  className={styles.exportBtn}
                  onClick={handleExportDetailed}
                >
                  📋 Xuất chi tiết Excel
                </button>
              </div>
              
              <div className={styles.tableContainer}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Mã SV</th>
                      <th>Họ tên</th>
                      <th>Lớp</th>
                      <th>Ngành</th>
                      <th>Chuyên đề</th>
                      <th>Điểm</th>
                      <th>Kết quả</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detailedReports
                      .slice((detailPage-1)*pageSize, detailPage*pageSize)
                      .map(report => (
                      <tr key={report.exam_id}>
                        <td>{report.student_code}</td>
                        <td>{report.student_name}</td>
                        <td>{report.class_name}</td>
                        <td>{report.major_name}</td>
                        <td>{report.topic_name}</td>
                        <td>{report.score}/{report.pass_score}</td>
                        <td className={report.result === 'Đạt' ? styles.passed : styles.failed}>
                          {report.result}
                        </td>
                        <td>{report.duration_minutes} phút</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {/* Pagination Controls */}
              {Math.ceil(detailedReports.length / pageSize) > 1 && (
                <div className={styles.pagination}>
                  <button 
                    onClick={() => setDetailPage(p => Math.max(1, p-1))}
                    disabled={detailPage === 1}
                  >
                    ←
                  </button>
                  {Array.from({ length: Math.ceil(detailedReports.length / pageSize) }, (_, i) => i + 1).map(p => (
                    <button
                      key={p}
                      className={p === detailPage ? styles.activePage : ''}
                      onClick={() => setDetailPage(p)}
                    >
                      {p}
                    </button>
                  ))}
                  <button 
                    onClick={() => setDetailPage(p => Math.min(Math.ceil(detailedReports.length / pageSize), p+1))}
                    disabled={detailPage === Math.ceil(detailedReports.length / pageSize)}
                  >
                    →
                  </button>
                </div>
              )}
            </div>
          )}

          {detailedReports.length === 0 && activeTab === 'detailed' && (
            <div className={styles.noData}>
              <p>Chọn bộ lọc và nhấn "Áp dụng" để xem báo cáo chi tiết</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReportAnalyticsPage;