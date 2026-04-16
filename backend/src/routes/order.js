const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authMiddleware } = require('../middlewares/auth');

// 所有路由都需要认证
router.use(authMiddleware);

// 用户端路由
router.post('/orders', orderController.createOrder); // 创建订单（兑换商品）
router.get('/orders', orderController.getMyOrders); // 获取我的订单列表
router.get('/orders/:id', orderController.getOrderDetail); // 获取订单详情
router.post('/orders/:id/cancel', orderController.cancelOrder); // 取消订单

// 运营方路由
router.get('/operator/orders', orderController.getOperatorOrders); // 获取运营方订单列表
router.get('/operator/orders/export', orderController.exportOrders); // 导出订单
router.put('/operator/orders/:id/status', orderController.updateOrderStatus); // 更新订单状态

module.exports = router;
