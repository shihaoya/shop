const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const tenantController = require('../controllers/tenantController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// 所有路由都需要admin权限
router.use(authMiddleware);
router.use(requireRole('admin'));

// 获取所有租户列表（支持状态筛选）
router.get('/tenants', tenantController.getTenants);
router.get('/tenants/pending', adminController.getPendingTenants);
router.post('/tenants/:id/approve', adminController.approveTenant);
router.post('/tenants/:id/reject', adminController.rejectTenant);

router.get('/users', adminController.getUserList);
router.get('/users/:id', adminController.getUserDetail);
router.put('/users/:id', adminController.updateUserInfo);
router.post('/users/:id/reset-password', adminController.resetUserPassword);
router.put('/users/:id/status', adminController.updateUserStatus);

router.put('/tenants/:id/status', adminController.updateTenantStatus);

router.get('/products/on-shelf', adminController.getOnShelfProducts);

router.get('/tenants/:id/audit-history', adminController.getTenantAuditHistory);

module.exports = router;
