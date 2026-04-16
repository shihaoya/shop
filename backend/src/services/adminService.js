const { User, Tenant, OperationLog, Product, TenantAuditHistory } = require('../models');
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
  
  // 获取管理员信息
  const admin = await User.findByPk(adminUserId);
  
  // 更新租户状态
  await tenant.update({ status: 'approved' });
  
  // 激活用户
  await User.update(
    { status: 1 },
    { where: { id: tenant.userId } }
  );
  
  // 记录审核历史
  await TenantAuditHistory.create({
    tenantId,
    previousStatus: 'pending',
    newStatus: 'approved',
    auditResult: 'approved',
    auditorId: adminUserId,
    auditorUsername: admin ? admin.username : null
  });
  
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
  
  // 获取管理员信息
  const admin = await User.findByPk(adminUserId);
  
  // 更新租户状态
  await tenant.update({
    status: 'rejected',
    rejectReason: reason
  });
  
  // 记录审核历史
  await TenantAuditHistory.create({
    tenantId,
    previousStatus: 'pending',
    newStatus: 'rejected',
    auditResult: 'rejected',
    rejectReason: reason,
    auditorId: adminUserId,
    auditorUsername: admin ? admin.username : null
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
const getUserList = async (page = 1, pageSize = 20, params = {}) => {
  const offset = (page - 1) * pageSize;
  const { username, nickname, role, startDate, endDate } = params;
  
  const where = {
    isDeleted: 0
  };
  
  // 用户名模糊查询
  if (username) {
    where.username = { [Op.like]: `%${username}%` };
  }
  
  // 昵称模糊查询
  if (nickname) {
    where.nickname = { [Op.like]: `%${nickname}%` };
  }
  
  // 角色筛选
  if (role) {
    where.role = role;
  }
  
  // 注册时间范围筛选
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt[Op.gte] = new Date(startDate);
    }
    if (endDate) {
      // 结束日期包含当天全天
      const endDateTime = new Date(endDate);
      endDateTime.setHours(23, 59, 59, 999);
      where.createdAt[Op.lte] = endDateTime;
    }
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

/**
 * 获取用户详情（包含租户信息）
 */
const getUserDetail = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'username', 'nickname', 'role', 'status', 'lastLoginAt', 'createdAt']
  });
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  // 如果是运营方，获取租户信息
  let tenantInfo = null;
  if (user.role === 'operator') {
    tenantInfo = await Tenant.findOne({
      where: { userId, isDeleted: 0 },
      attributes: ['id', 'name', 'description', 'status', 'rejectReason', 'createdAt', 'updatedAt']
    });
  }
  
  return {
    ...user.toJSON(),
    tenantInfo
  };
};

/**
 * 更新用户信息
 */
const updateUserInfo = async (userId, userData, adminUserId) => {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  const allowedFields = ['nickname', 'role', 'status'];
  const updateData = {};
  
  allowedFields.forEach(field => {
    if (userData[field] !== undefined) {
      updateData[field] = userData[field];
    }
  });
  
  // 如果修改了角色或状态，需要验证
  if (updateData.role && !['admin', 'operator', 'user'].includes(updateData.role)) {
    throw new Error('无效的角色值');
  }
  
  if (updateData.status !== undefined && ![0, 1].includes(Number(updateData.status))) {
    throw new Error('无效的状态值');
  }
  
  await user.update(updateData);
  
  // 记录操作日志
  await OperationLog.create({
    userId: adminUserId,
    operationType: 'update_user',
    operationModule: 'user',
    operationDesc: `更新用户信息，用户ID: ${userId}, 用户名: ${user.username}`
  });
  
  logger.info(`管理员更新用户信息，用户ID: ${userId}`);
  
  return user;
};

/**
 * 更新租户审核状态
 */
const updateTenantStatus = async (tenantId, statusData, adminUserId) => {
  const tenant = await Tenant.findByPk(tenantId);
  
  if (!tenant) {
    throw new Error('租户不存在');
  }
  
  const { status, rejectReason } = statusData;
  
  if (status && !['pending', 'approved', 'rejected'].includes(status)) {
    throw new Error('无效的审核状态');
  }
  
  const previousStatus = tenant.status;
  const updateData = {};
  if (status) {
    updateData.status = status;
  }
  if (rejectReason !== undefined) {
    updateData.rejectReason = rejectReason || null;
  }
  
  await tenant.update(updateData);
  
  // 如果状态发生变化，记录审核历史
  if (status && status !== previousStatus) {
    // 获取管理员信息
    const admin = await User.findByPk(adminUserId);
    
    const auditResult = status === 'approved' ? 'approved' : (status === 'rejected' ? 'rejected' : null);
    
    if (auditResult) {
      await TenantAuditHistory.create({
        tenantId,
        previousStatus,
        newStatus: status,
        auditResult,
        rejectReason: status === 'rejected' ? (rejectReason || null) : null,
        auditorId: adminUserId,
        auditorUsername: admin ? admin.username : null
      });
    }
  }
  
  // 记录操作日志
  await OperationLog.create({
    userId: adminUserId,
    operationType: 'update_tenant_status',
    operationModule: 'tenant',
    operationDesc: `更新租户审核状态，租户ID: ${tenantId}, 新状态: ${status || tenant.status}`
  });
  
  logger.info(`管理员更新租户审核状态，租户ID: ${tenantId}`);
  
  return tenant;
};

/**
 * 获取所有上架商品列表
 */
const getOnShelfProducts = async (page = 1, pageSize = 20, keyword = null) => {
  const offset = (page - 1) * pageSize;
  
  const where = {
    status: 'on_shelf',
    isDeleted: 0
  };
  
  if (keyword) {
    where.name = { [Op.like]: `%${keyword}%` };
  }
  
  const { count, rows } = await Product.findAndCountAll({
    where,
    include: [{
      model: Tenant,
      as: 'tenant',
      attributes: ['id', 'name'],
      include: [{
        model: User,
        as: 'user',
        attributes: ['id', 'username', 'nickname']
      }]
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
 * 获取租户审核历史
 */
const getTenantAuditHistory = async (tenantId, page = 1, pageSize = 20) => {
  const offset = (page - 1) * pageSize;
  
  const { count, rows } = await TenantAuditHistory.findAndCountAll({
    where: { tenantId },
    include: [{
      model: User,
      as: 'auditor',
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
 * 创建新用户
 */
const createUser = async (userData, adminUserId) => {
  const { username, password, nickname, role, status = 1 } = userData;
  
  // 验证必填字段
  if (!username || !password) {
    throw new Error('用户名和密码不能为空');
  }
  
  // 验证角色
  if (!['admin', 'operator', 'user'].includes(role)) {
    throw new Error('无效的角色类型');
  }
  
  // 检查用户名是否已存在
  const existingUser = await User.findOne({
    where: { username }
  });
  
  if (existingUser) {
    throw new Error('用户名已存在');
  }
  
  // 密码加密
  const hashedPassword = await hashPassword(password);
  
  // 创建用户
  const user = await User.create({
    username,
    password: hashedPassword,
    nickname: nickname || username,
    role,
    status: Number(status),
    isDeleted: 0
  });
  
  // 记录操作日志
  await OperationLog.create({
    userId: adminUserId,
    operationType: 'create_user',
    operationModule: 'user',
    operationDesc: `管理员创建新用户，用户名: ${username}, 角色: ${role}`
  });
  
  logger.info(`管理员创建新用户，用户名: ${username}`);
  
  return {
    id: user.id,
    username: user.username,
    nickname: user.nickname,
    role: user.role
  };
};

/**
 * 删除用户（逻辑删除）
 */
const deleteUser = async (userId, adminUserId) => {
  const user = await User.findByPk(userId);
  
  if (!user) {
    throw new Error('用户不存在');
  }
  
  // 不允许删除自己
  if (user.id === adminUserId) {
    throw new Error('不能删除当前登录的管理员账号');
  }
  
  // 不允许删除其他管理员
  if (user.role === 'admin') {
    throw new Error('不能删除管理员账号，请联系系统超级管理员');
  }
  
  // 如果是运营方，检查是否有租户
  if (user.role === 'operator') {
    const tenant = await Tenant.findOne({
      where: { userId }
    });
    
    if (tenant) {
      throw new Error('该用户有关联的租户，请先处理租户数据后再删除');
    }
  }
  
  // 逻辑删除
  await user.update({
    isDeleted: 1,
    status: 0
  });
  
  // 记录操作日志
  await OperationLog.create({
    userId: adminUserId,
    operationType: 'delete_user',
    operationModule: 'user',
    operationDesc: `管理员删除用户，用户名: ${user.username}, 角色: ${user.role}`
  });
  
  logger.info(`管理员删除用户，用户名: ${user.username}`);
  
  return true;
};

module.exports = {
  getPendingTenants,
  approveTenant,
  rejectTenant,
  getUserList,
  resetUserPassword,
  updateUserStatus,
  getUserDetail,
  updateUserInfo,
  updateTenantStatus,
  getOnShelfProducts,
  getTenantAuditHistory,
  createUser,
  deleteUser
};

