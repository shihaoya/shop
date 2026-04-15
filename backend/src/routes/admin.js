const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// 所有路由都需要admin权限
router.use(authMiddleware);
router.use(requireRole('admin'));

router.get('/tenants/pending', adminController.getPendingTenants);
router.post('/tenants/:id/approve', adminController.approveTenant);
router.post('/tenants/:id/reject', adminController.rejectTenant);

router.get('/users', adminController.getUserList);
router.post('/users/:id/reset-password', adminController.resetUserPassword);
router.put('/users/:id/status', adminController.updateUserStatus);

module.exports = router;
