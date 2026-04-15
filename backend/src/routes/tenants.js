const express = require('express');
const router = express.Router();
const tenantController = require('../controllers/tenantController');
const { authenticate, requireRole } = require('../middlewares/auth');

// 所有租户接口都需要认证
router.use(authenticate);

// 获取租户列表（所有登录用户）
router.get('/', tenantController.getTenants);

// 获取租户详情（所有登录用户）
router.get('/:id', tenantController.getTenantById);

module.exports = router;
