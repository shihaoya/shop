const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// 所有租户接口都需要认证
router.use(authMiddleware);

// 获取运营方自己的租户审核状态（operator专用）
router.get('/my-status', tenantController.getMyTenantStatus);

// 运营方重新提交审核（operator专用）
router.put('/resubmit', tenantController.resubmitAudit);

// 获取租户列表（所有登录用户）
router.get('/', tenantController.getTenants);

// 获取租户详情（所有登录用户）
router.get('/:id', tenantController.getTenantById);

module.exports = router;
