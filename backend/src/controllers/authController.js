const authService = require('../services/authService');
const { success, error } = require('../utils/response');
const { logger } = require('../middlewares/logger');

/**
 * 用户注册
 */
const register = async (req, res) => {
  try {
    const { username, password, nickname, role, description } = req.body;
    
    // 参数验证
    if (!username || !password || !role) {
      return error(res, '缺少必填参数', 400);
    }
    
    if (!['user', 'operator'].includes(role)) {
      return error(res, '无效的角色类型', 400);
    }
    
    const result = await authService.register({
      username,
      password,
      nickname,
      role,
      description
    });
    
    return success(res, result, '注册成功');
  } catch (err) {
    logger.error('注册失败:', err.message);
    return error(res, err.message, 400);
  }
};

/**
 * 用户登录
 */
const login = async (req, res) => {
  try {
    const { username, password, rememberMe } = req.body;
    
    // 参数验证
    if (!username || !password) {
      return error(res, '用户名和密码不能为空', 400);
    }
    
    const result = await authService.login(username, password, rememberMe);
    
    return success(res, result, '登录成功');
  } catch (err) {
    logger.error('登录失败:', err.message);
    return error(res, err.message, 401);
  }
};

/**
 * 刷新Token
 */
const refreshToken = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return error(res, '请提供Token', 400);
    }
    
    const oldToken = authHeader.split(' ')[1];
    const result = await authService.refreshToken(oldToken);
    
    return success(res, result, 'Token刷新成功');
  } catch (err) {
    logger.error('Token刷新失败:', err.message);
    return error(res, err.message, 401);
  }
};

/**
 * 退出登录
 */
const logout = async (req, res) => {
  // JWT是无状态的，客户端删除Token即可
  return success(res, null, '退出成功');
};

module.exports = {
  register,
  login,
  refreshToken,
  logout
};
