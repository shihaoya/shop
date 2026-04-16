const express = require('express');
const router = express.Router();

const authRoutes = require('./auth');
const adminRoutes = require('./admin');
const tenantRoutes = require('./tenants');
const operatorProductRoutes = require('./operator-products');
const operatorUserRoutes = require('./operator-users');
const operatorPointRoutes = require('./operator-points');
const operatorMessageRoutes = require('./operator-messages');
const userRoutes = require('./user');
const orderRoutes = require('./order');
const messageRoutes = require('./messages');

// API v1 路由
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/tenants', tenantRoutes);
router.use('/operator/products', operatorProductRoutes);
router.use('/operator/users', operatorUserRoutes);
router.use('/operator/points', operatorPointRoutes);
router.use('/operator/messages', operatorMessageRoutes);
router.use('/user', userRoutes);
router.use('/', orderRoutes); // 订单路由
router.use('/messages', messageRoutes); // 消息路由

// 健康检查
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

module.exports = router;
