const express = require('express');
const router = express.Router();
const userProgressController = require('../controllers/userProgressController');
const authMiddleware = require('../middlewares/authMiddleware');

// Lấy tiến độ chuyên đề của sinh viên
router.get('/progress', authMiddleware, userProgressController.getUserProgress);

module.exports = router;
