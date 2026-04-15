const adminService = require('../services/adminService');
const { success, error } = require('../utils/response');
const { logger } = require('../middlewares/logger');

/**
 * 获取待审核的运营方列表
 */
const getPendingTenants = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    
    const result = await adminService.getPendingTenants(page, pageSize);
    
    return success(res, result);
  } catch (err) {
    // 处理 Sequelize 错误
    const errorMsg = err.original 
      ? err.original.message 
      : (err.message || '未知错误');
    
    // 记录详细错误信息
    logger.error(`获取待审核列表失败: ${errorMsg}`);
    console.error('=== 完整错误堆栈 ===');
    console.error(err);
    if (err.original) {
      console.error('Sequelize原始错误:', err.original);
    }
    console.error('==================');
    
    return error(res, errorMsg, 500);
  }
};

/**
 * 通过审核
 */
const approveTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;
    
    await adminService.approveTenant(id, adminUserId);
    
    return success(res, null, '审核通过');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : err.message;
    logger.error(`审核通过失败: ${errorMsg}`);
    return error(res, errorMsg || '操作失败', 400);
  }
};

/**
 * 拒绝审核
 */
const rejectTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminUserId = req.user.id;
    
    await adminService.rejectTenant(id, reason, adminUserId);
    
    return success(res, null, '已拒绝');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : err.message;
    logger.error(`拒绝审核失败: ${errorMsg}`);
    return error(res, errorMsg || '操作失败', 400);
  }
};

/**
 * 获取用户列表
 */
const getUserList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, role, keyword } = req.query;
    
    const result = await adminService.getUserList(page, pageSize, role, keyword);
    
    return success(res, result);
  } catch (err) {
    const errorMsg = err.original ? err.original.message : err.message;
    logger.error(`获取用户列表失败: ${errorMsg}`);
    return error(res, errorMsg || '服务器内部错误', 500);
  }
};

/**
 * 重置用户密码
 */
const resetUserPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;
    
    const result = await adminService.resetUserPassword(id, adminUserId);
    
    return success(res, result, '密码重置成功');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : err.message;
    logger.error(`重置密码失败: ${errorMsg}`);
    return error(res, errorMsg || '操作失败', 400);
  }
};

/**
 * 修改用户状态
 */
const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const adminUserId = req.user.id;
    
    if (![0, 1].includes(Number(status))) {
      return error(res, '无效的状态值', 400);
    }
    
    await adminService.updateUserStatus(id, Number(status), adminUserId);
    
    return success(res, null, '状态更新成功');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : err.message;
    logger.error(`更新用户状态失败: ${errorMsg}`);
    return error(res, errorMsg || '操作失败', 400);
  }
};

module.exports = {
  getPendingTenants,
  approveTenant,
  rejectTenant,
  getUserList,
  resetUserPassword,
  updateUserStatus
};
