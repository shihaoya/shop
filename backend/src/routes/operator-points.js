const express = require('express');
const router = express.Router();
const pointController = require('../controllers/pointController');
const { authenticate, requireRole } = require('../middlewares/auth');

// 所有积分管理接口都需要operator角色
router.use(authenticate);
router.use(requireRole('operator'));

// 用户积分列表
router.get('/users', pointController.getPointsUsers);

// 积分操作
router.post('/:userId/add', pointController.addPoints);
router.post('/:userId/subtract', pointController.subtractPoints);
router.post('/:userId/modify', pointController.modifyPoints);

// 批量调整
router.post('/batch-adjust', pointController.batchAdjustPoints);

// 积分流水
router.get('/:userId/transactions', pointController.getPointTransactions);

module.exports = router;
