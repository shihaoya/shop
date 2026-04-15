const express = require('express');
const router = express.Router();
const messageController = require('../controllers/messageController');
const { authMiddleware, requireRole } = require('../middlewares/auth');

// 所有消息路由都需要认证
router.use(authMiddleware);

// 用户获取自己的消息
router.get('/my-messages', messageController.getMyMessages);
router.get('/unread-count', messageController.getUnreadCount);
router.get('/:messageId', messageController.getMessageDetail);
router.put('/:messageId/read', messageController.markAsRead);
router.put('/mark-all-read', messageController.markAllAsRead);
router.delete('/:messageId', messageController.deleteMessage);
router.post('/batch-delete', messageController.batchDeleteMessages);

// 管理员发送系统消息
router.post('/send', requireRole('admin'), messageController.sendSystemMessage);
router.post('/broadcast', requireRole('admin'), messageController.broadcastMessage);

module.exports = router;
