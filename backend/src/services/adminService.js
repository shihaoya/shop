const { User, Tenant, OperationLog } = require('../models');
const { hashPassword, generateRandomPassword } = require('../utils/encrypt');
const { logger } = require('../middlewares/logger');
const { Op } = require('sequelize');

/**
 * 获取待审核的运营方列表
 */
const getPendingTenants = async (page = 1, pageSize = 20) => {
  const offset = (page - 1) * pageSize;
  
  const { count, rows } = await Tenant.findAndCountAll({
    where: {
      status: 'pending',
      isDeleted: 0
    },
    include: [{
      model: User,
      as: 'user',
      attributes: ['id', 'username', 'nickname']
    }],
    limit: parseInt(pageSize),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });
  
  return {
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    list: rows
  };
};

/**
 * 通过审核
 */
const approveTenant = async (tenantId, adminUserId) => {
  const tenant = await Tenant.findByPk(tenantId);
  
  if (!tenant) {
    throw new Error('租户不存在');
  }
  
  if (tenant.status !== 'pending') {
    throw new Error('该申请已处理');
  }
  
  // 更新租户状态
  await tenant.update({ status: 'approved' });
  
  // 激活用户
  await User.update(
    { status: 1 },
    { where: { id: tenant.userId } }
  );
  
  // 记录操作日志
  await OperationLog.create({
    userId: adminUserId,
    operationType: 'approve',
    operationModule: 'tenant',
    operationDesc: `通过运营方审核，租户ID: ${tenantId}`
  });
  
  logger.info(`运营方审核通过，租户ID: ${tenantId}`);
  
  return tenant;
};

/**
 * 拒绝审核
 */
const rejectTenant = async (tenantId, reason, adminUserId) => {
  const tenant = await Tenant.findByPk(tenantId);
  
  if (!tenant) {
    throw new Error('租户不存在');
  }
  
  if (tenant.status !== 'pending') {
    throw new Error('该申请已处理');
  }
  
  if (!reason) {
    throw new Error('请填写拒绝原因');
  }
  
  // 更新租户状态
  await tenant.update({
    status: 'rejected',
    rejectReason: reason
  });
  
  // 记录操作日志
  await OperationLog.create({
    userId: adminUserId,
    operationType: 'reject',
    operationModule: 'tenant',
    operationDesc: `拒绝运营方审核，租户ID: ${tenantId}, 原因: ${reason}`
  });
  
  logger.info(`运营方审核拒绝，租户ID: ${tenantId}, 原因: ${reason}`);
  
  return tenant;
};

/**
 * 获取用户列表
 */
const getUserList = async (page = 1, pageSize = 20, role = null, keyword = null) => {
  const offset = (page - 1) * pageSize;
  
  const where = {
    isDeleted: 0
  };
  
  if (role) {
    where.role = role;
  }
  
  if (keyword) {
    where[Op.or] = [
      { username: { [Op.like]: `%${keyword}%` } },
      { nickname: { [Op.like]: `%${keyword}%` } }
    ];
  }
  
  const { count, rows } = await User.findAndCountAll({
    where,
    attributes: ['id', 'username', 'nickname', 'role', 'status', 'lastLoginAt', 'createdAt'],
    limit: parseInt(pageSize),
    offset: parseInt(offset),
    order: [['createdAt', 'DESC']]
  });
  
  return {
    total: count,
    page: parseInt(page),
    pageSize: parseInt(pageSize),
    list: rows
  };
};

/**
 * 重置用户密码
 */
const resetUserPassword = async (userId, adminUserId) => {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  // 生成随机密码
  const newPassword = generateRandomPassword(8);
  const hashedPassword = await hashPassword(newPassword);
  
  // 更新密码
  await user.update({
    password: hashedPassword,
    loginFailCount: 0,
    lockedUntil: null
  });
  
  // 记录操作日志
  await OperationLog.create({
    userId: adminUserId,
    operationType: 'reset_password',
    operationModule: 'user',
    operationDesc: `重置用户密码，用户ID: ${userId}, 用户名: ${user.username}`
  });
  
  logger.info(`重置用户密码，用户ID: ${userId}`);
  
  return {
    username: user.username,
    newPassword // 返回明文密码给管理员线下告知用户
  };
};

/**
 * 修改用户状态
 */
const updateUserStatus = async (userId, status, adminUserId) => {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  if (![0, 1].includes(status)) {
    throw new Error('无效的状态值');
  }
  
  await user.update({ status });
  
  // 记录操作日志
  await OperationLog.create({
    userId: adminUserId,
    operationType: 'update_status',
    operationModule: 'user',
    operationDesc: `修改用户状态，用户ID: ${userId}, 新状态: ${status === 1 ? '启用' : '禁用'}`
  });
  
  logger.info(`修改用户状态，用户ID: ${userId}, 新状态: ${status}`);
  
  return user;
};

module.exports = {
  getPendingTenants,
  approveTenant,
  rejectTenant,
  getUserList,
  resetUserPassword,
  updateUserStatus
};

