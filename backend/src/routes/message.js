const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authMiddleware } = require('../middlewares/auth');

// 所有路由都需要认证
router.use(authMiddleware);

// 用户端消息路由
router.get('/messages', messageController.getMessages); // 获取消息列表
router.put('/messages/:id/read', messageController.markAsRead); // 标记已读
router.put('/messages/mark-read', messageController.markBatchAsRead); // 批量标记已读
router.delete('/messages/:id', messageController.deleteMessage); // 删除消息
router.get('/messages/unread-count', messageController.getUnreadCount); // 未读数量

// 运营方消息路由
router.get('/operator/messages', messageController.getOperatorMessages); // 运营方消息列表

module.exports = router;
