const jwt = require('jsonwebtoken');
const config = require('../config');
const { unauthorized } = require('../utils/response');
const { User } = require('../models');

/**
 * JWT认证中间件
 */
const authMiddleware = async (req, res, next) => {
  try {
    // 从请求头获取Token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorized(res, '请提供认证Token');
    }

    const token = authHeader.split(' ')[1];

    // 验证Token
    const decoded = jwt.verify(token, config.jwt.secret);
    
    // 查询用户
    const user = await User.findOne({
      where: {
        id: decoded.userId,
        isDeleted: 0
      }
    });

    if (!user) {
      return unauthorized(res, '用户不存在');
    }

    if (user.status === 0) {
      return unauthorized(res, '账号已被禁用');
    }

    // 将用户信息注入request
    req.user = {
      id: user.id,
      username: user.username,
      role: user.role
    };

    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return unauthorized(res, 'Token已过期');
    }
    if (error.name === 'JsonWebTokenError') {
      return unauthorized(res, '无效的Token');
    }
    console.error('Auth middleware error:', error);
    return unauthorized(res, '认证失败');
  }
};

/**
 * 角色权限检查中间件
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return unauthorized(res, '请先登录');
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        code: 403,
        message: '权限不足'
      });
    }

    next();
  };
};

module.exports = {
  authMiddleware,
  requireRole
};

