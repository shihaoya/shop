const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// 所有用户接口都需要user角色
router.use(authMiddleware);
router.use(requireRole('user'));

// 运营方列表
router.get('/tenants', userController.getTenantsForUser);

// 申请加入运营方
router.post('/tenants/:tenantId/apply', userController.applyJoinTenant);

// 查看我的申请
router.get('/applications', userController.getMyApplications);

// 切换运营方视角
router.post('/tenants/:tenantId/switch', userController.switchTenant);

// 查看当前积分
router.get('/points', userController.getCurrentPoints);

// 查看积分流水
router.get('/points/transactions', userController.getPointTransactions);

module.exports = router;
