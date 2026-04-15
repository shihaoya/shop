const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authMiddleware } = require('../middlewares/auth');

// 公开路由，不需要认证
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

// 需要认证的路由
router.get('/me', authMiddleware, authController.getMe);
router.post('/change-password', authMiddleware, authController.changePassword);
router.put('/profile', authMiddleware, authController.updateProfile);

module.exports = router;
