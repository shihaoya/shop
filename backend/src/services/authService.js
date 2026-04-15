const jwt = require('jsonwebtoken');
const config = require('../config');
const { User, Tenant } = require('../models');
const { hashPassword, verifyPassword } = require('../utils/encrypt');
const { logger } = require('../middlewares/logger');

/**
 * 用户注册
 */
const register = async (userData) => {
  const { username, password, nickname, role } = userData;
  
  // 检查用户名是否已存在
  const existingUser = await User.findOne({
    where: { username, isDeleted: 0 }
  });
  
  if (existingUser) {
    throw new Error('用户名已存在');
  }
  
  // 验证密码强度
  if (password.length < 8) {
    throw new Error('密码长度至少8位');
  }
  
  if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
    throw new Error('密码必须包含字母和数字');
  }
  
  // 加密密码
  const hashedPassword = await hashPassword(password);
  
  // 创建用户
  const user = await User.create({
    username,
    password: hashedPassword,
    nickname: nickname || username,
    role: role || 'user',
    status: 1
  });
  
  // 如果是运营方，创建待审核的租户
  if (role === 'operator') {
    await Tenant.create({
      userId: user.id,
      name: username, // 默认使用用户名作为租户名称
      description: userData.description || '',
      status: 'pending'
    });
  }
  
  logger.info(`用户注册成功: ${username}, 角色: ${role}`);
  
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    role: user.role
  };
};

/**
 * 用户登录
 */
const login = async (username, password, rememberMe = false) => {
  // 查询用户
  const user = await User.findOne({
    where: { username, isDeleted: 0 }
  });
  
  if (!user) {
    throw new Error('用户名或密码错误');
  }
  
  // 检查账号是否被锁定
  if (user.lockedUntil && new Date() < user.lockedUntil) {
    const remainingMinutes = Math.ceil((user.lockedUntil - new Date()) / 60000);
    throw new Error(`账号已被锁定，请${remainingMinutes}分钟后重试`);
  }
  
  // 验证密码
  const isValidPassword = await verifyPassword(password, user.password);
  
  if (!isValidPassword) {
    // 增加失败次数
    const newFailCount = user.loginFailCount + 1;
    const updates = { loginFailCount: newFailCount };
    
    // 失败5次锁定30分钟
    if (newFailCount >= 5) {
      updates.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      logger.warn(`用户登录失败次数过多，账号已锁定: ${username}`);
    }
    
    await user.update(updates);
    throw new Error('用户名或密码错误');
  }
  
  // 登录成功，重置失败次数
  await user.update({
    loginFailCount: 0,
    lockedUntil: null,
    lastLoginAt: new Date()
  });
  
  // 生成Token
  const tokenPayload = {
    userId: user.id,
    username: user.username,
    role: user.role
  };
  
  const expiresIn = rememberMe ? config.jwt.refreshExpiresIn : config.jwt.expiresIn;
  const token = jwt.sign(tokenPayload, config.jwt.secret, { expiresIn });
  
  logger.info(`用户登录成功: ${username}`);
  
  return {
    token,
    expiresIn,
    user: {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      role: user.role
    }
  };
};

/**
 * 刷新Token
 */
const refreshToken = async (oldToken) => {
  try {
    const decoded = jwt.verify(oldToken, config.jwt.secret);
    
    const user = await User.findOne({
      where: {
        id: decoded.userId,
        isDeleted: 0,
        status: 1
      }
    });
    
    if (!user) {
      throw new Error('用户不存在');
    }
    
    // 生成新Token
    const tokenPayload = {
      userId: user.id,
      username: user.username,
      role: user.role
    };
    
    const token = jwt.sign(tokenPayload, config.jwt.secret, {
      expiresIn: config.jwt.expiresIn
    });
    
    return { token, expiresIn: config.jwt.expiresIn };
  } catch (error) {
    throw new Error('Token无效或已过期');
  }
};

module.exports = {
  register,
  login,
  refreshToken
};

