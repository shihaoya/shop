const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 公开路由，不需要认证
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);
router.post('/logout', authController.logout);

module.exports = router;
