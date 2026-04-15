const express = require('express');
const router = express.Router();
const pointController = require('../controllers/pointController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// 所有积分管理接口都需要operator角色
router.use(authMiddleware);
router.use(requireRole('operator'));

// 用户积分列表
router.get('/users', pointController.getPointsUsers);

// 批量调整（必须在 /:userId 之前）
router.post('/batch-adjust', pointController.batchAdjustPoints);

// 带参数的路由放在最后
router.post('/:userId/add', pointController.addPoints);
router.post('/:userId/subtract', pointController.subtractPoints);
router.post('/:userId/modify', pointController.modifyPoints);
router.get('/:userId/transactions', pointController.getPointTransactions);

module.exports = router;
