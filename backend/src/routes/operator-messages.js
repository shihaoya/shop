const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// 所有路由都需要认证且需要 operator 角色
router.use(authMiddleware);
router.use(requireRole('operator'));

// 运营方消息路由
router.get('/', messageController.getOperatorMessages); // 获取运营方消息列表
router.put('/:id/read', messageController.markAsRead); // 标记已读
router.delete('/:id', messageController.deleteMessage); // 删除消息
router.get('/unread-count', messageController.getUnreadCount); // 未读数量

module.exports = router;
