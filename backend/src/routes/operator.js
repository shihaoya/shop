const express = require('express');
const router = express.Router();
const operatorController = require('../controllers/operatorController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// 所有运营方接口都需要operator角色
router.use(authMiddleware);
router.use(requireRole('operator'));

// 工作台统计数据
router.get('/dashboard/stats', operatorController.getDashboardStats);

module.exports = router;
