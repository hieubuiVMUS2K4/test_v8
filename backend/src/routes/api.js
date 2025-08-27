const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const TopicController = require('../controllers/topicController');
const UserProgressController = require('../controllers/userProgressController');
const StudentController = require('../controllers/studentController');
const DashboardController = require('../controllers/dashboardController');
const ScheduleController = require('../controllers/scheduleController');
const StudentSubjectsController = require('../controllers/studentSubjectsController');
const ReportController = require('../controllers/reportController');
const { authenticateToken, requireAdmin, requireStudent, requireAuth } = require('../middleware/authMiddleware');

// ============= AUTH ROUTES =============
// Public routes (không cần authentication)
router.post('/login', AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/refresh-token', AuthController.refreshToken);

// Protected routes (cần authentication)
router.get('/verify-token', authenticateToken, AuthController.verifyToken);

// ============= TOPIC ROUTES =============
// Routes cho topics/subjects
router.get('/topics', authenticateToken, TopicController.getTopics);
router.post('/topics', authenticateToken, requireAdmin, TopicController.createTopic);
router.get('/topics/:id', authenticateToken, TopicController.getTopicById);
router.put('/topics/:id', authenticateToken, requireAdmin, TopicController.updateTopic);
router.delete('/topics/:id', authenticateToken, requireAdmin, TopicController.deleteTopic);
router.get('/topics/:id/questions', authenticateToken, TopicController.getTopicQuestions);
router.post('/topics/:id/import-questions', authenticateToken, requireAdmin, TopicController.importQuestions);
router.delete('/questions/:id', authenticateToken, requireAdmin, TopicController.deleteQuestion);
router.put('/questions/:id', authenticateToken, TopicController.updateQuestion);
// Đồng bộ lại question_count thủ công (admin)
router.post('/topics-sync/question-counts', authenticateToken, requireAdmin, TopicController.syncQuestionCounts);

// ============= ADMIN ROUTES =============
// Chỉ admin mới có thể truy cập

// Dashboard Routes
router.get('/admin/dashboard', authenticateToken, requireAdmin, DashboardController.getDashboardData);
router.get('/admin/dashboard/stats', authenticateToken, requireAdmin, DashboardController.getDetailedStats);
router.get('/admin/dashboard/realtime', authenticateToken, requireAdmin, DashboardController.getRealtimeUpdates);

// Student Management Routes
router.get('/admin/students', authenticateToken, requireAdmin, StudentController.getAllStudents);
router.get('/admin/students/search', authenticateToken, requireAdmin, StudentController.searchStudents);
router.get('/admin/students/stats', authenticateToken, requireAdmin, StudentController.getStudentStats);
router.get('/admin/students/:id', authenticateToken, requireAdmin, StudentController.getStudentById);
router.post('/admin/students', authenticateToken, requireAdmin, StudentController.addStudent);
router.put('/admin/students/:id', authenticateToken, requireAdmin, StudentController.updateStudent);
router.delete('/admin/students/:id', authenticateToken, requireAdmin, StudentController.deleteStudent);
router.delete('/admin/students', authenticateToken, requireAdmin, StudentController.bulkDeleteStudents);
router.patch('/admin/students/:id/status', authenticateToken, requireAdmin, StudentController.updateStudentStatus);

// Academic Structure Routes (Departments, Majors, Classes)
router.get('/admin/departments', authenticateToken, requireAdmin, StudentController.getDepartments);
router.get('/admin/departments/:departmentId/majors', authenticateToken, requireAdmin, StudentController.getMajorsByDepartment);
router.get('/admin/majors/:majorId/classes', authenticateToken, requireAdmin, StudentController.getClassesByMajor);

// Schedule Management Routes
router.get('/admin/schedules', authenticateToken, requireAdmin, ScheduleController.getSchedules);
router.post('/admin/schedules', authenticateToken, requireAdmin, ScheduleController.createSchedule);
router.put('/admin/schedules/:id', authenticateToken, requireAdmin, ScheduleController.updateSchedule);
router.delete('/admin/schedules/:id', authenticateToken, requireAdmin, ScheduleController.deleteSchedule);
// Xóa toàn bộ lịch hoặc theo khoa: /admin/schedules?department_id=1
router.delete('/admin/schedules', authenticateToken, requireAdmin, ScheduleController.deleteAllSchedules);

// Report Management Routes
router.get('/admin/reports/statistics', authenticateToken, requireAdmin, ReportController.getExamStatistics);
router.get('/admin/reports/detailed', authenticateToken, requireAdmin, ReportController.getDetailedReport);
router.get('/admin/reports/filter-options', authenticateToken, requireAdmin, ReportController.getFilterOptions);
router.get('/admin/reports/student-completion', authenticateToken, requireAdmin, ReportController.getStudentCompletionStats);

// ============= STUDENT ROUTES =============
// Chỉ student mới có thể truy cập
router.get('/user/progress', authenticateToken, UserProgressController.getUserProgress);
router.get('/exams/student/history', authenticateToken, StudentSubjectsController.getExamHistory);
// Modify to allow both STUDENT and ADMIN access to this endpoint for debugging
router.get('/student/subjects', authenticateToken, requireAuth, StudentSubjectsController.getStudentSubjects);

// Các routes mới cho xử lý bài thi
router.get('/topics/:topicId/exam-questions', authenticateToken, requireStudent, StudentSubjectsController.getExamQuestions);
router.get('/topics/:topicId/can-take', authenticateToken, requireStudent, StudentSubjectsController.canTakeQuiz);
router.post('/exams/:examId/submit', authenticateToken, requireStudent, StudentSubjectsController.submitExam);
router.post('/exams/:examId/autosave', authenticateToken, requireStudent, StudentSubjectsController.autosaveExam);

// ============= COMMON ROUTES =============
// Cả admin và student đều có thể truy cập

module.exports = router;