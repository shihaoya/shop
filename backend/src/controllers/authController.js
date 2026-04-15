const authService = require('../services/authService');
const { User } = require('../models');
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
    logger.error(`注册失败: ${err.message}`);
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
    logger.error(`登录失败: ${err.message}`);
    return error(res, err.message, 401);
  }
};

/**
 * 修改密码
 */
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { oldPassword, newPassword } = req.body;
    
    // 参数验证
    if (!oldPassword || !newPassword) {
      return error(res, '旧密码和新密码不能为空', 400);
    }
    
    const result = await authService.changePassword(userId, oldPassword, newPassword);
    
    return success(res, null, '密码修改成功');
  } catch (err) {
    logger.error(`修改密码失败: ${err.message}`);
    return error(res, err.message, 400);
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
    logger.error(`Token刷新失败: ${err.message}`);
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

/**
 * 获取当前用户信息
 */
const getMe = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findByPk(userId, {
      attributes: ['id', 'username', 'nickname', 'role', 'status', 'createdAt']
    });
    
    if (!user) {
      return error(res, '用户不存在', 404);
    }
    
    // 如果是普通用户，尝试获取当前租户的积分余额
    if (user.role === 'user') {
      const { UserTenantRelation } = require('../models');
      const tenantId = req.query.tenantId;
      
      if (tenantId) {
        const relation = await UserTenantRelation.findOne({
          where: {
            userId,
            tenantId,
            status: 'approved',
            isDeleted: 0
          },
          attributes: ['pointsBalance']
        });
        
        if (relation) {
          user.dataValues.pointsBalance = relation.pointsBalance;
        } else {
          user.dataValues.pointsBalance = 0;
        }
      } else {
        user.dataValues.pointsBalance = 0;
      }
    }
    
    return success(res, user, '获取成功');
  } catch (err) {
    logger.error(`获取用户信息失败: ${err.message}`);
    return error(res, err.message, 500);
  }
};

/**
 * 更新用户资料
 */
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const profileData = req.body;
    
    const user = await authService.updateProfile(userId, profileData);
    
    return success(res, user, '资料更新成功');
  } catch (err) {
    logger.error(`更新资料失败: ${err.message}`);
    return error(res, err.message, 400);
  }
};

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
  updateProfile
};
