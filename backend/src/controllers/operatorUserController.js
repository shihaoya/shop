const { User, Tenant, UserTenantRelation } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcryptjs');
const { logger } = require('../middlewares/logger');
const { success, error } = require('../utils/response');

/**
 * 辅助函数：获取运营方的租户ID
 */
async function getOperatorTenantId(userId) {
  const tenant = await Tenant.findOne({
    where: { userId, isDeleted: 0 }
  });
  
  if (!tenant) {
    throw new Error('您还没有关联的租户');
  }
  
  return tenant.id;
}

/**
 * 获取可添加的用户列表（用于下拉选择）
 */
exports.getAvailableUsers = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { keyword, pageSize = 20 } = req.query;

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    // 获取已在此租户中的用户ID
    const existingRelations = await UserTenantRelation.findAll({
      where: {
        tenantId,
        isDeleted: 0
      },
      attributes: ['userId']
    });
    const existingUserIds = existingRelations.map(r => r.userId);

    // 构建查询条件
    const where = {
      isDeleted: 0,
      id: {
        [Op.notIn]: existingUserIds.length > 0 ? existingUserIds : [0]
      }
    };

    // 关键词搜索
    if (keyword) {
      where.username = { [Op.like]: `%${keyword}%` };
    }

    // 查询用户
    const users = await User.findAll({
      where,
      attributes: ['id', 'username', 'nickname'],
      limit: parseInt(pageSize),
      order: [['createdAt', 'DESC']]
    });

    return success(res, {
      list: users,
      total: users.length
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取可添加用户失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 创建新用户（简化版：只需要用户名、昵称、积分）
 */
exports.createNewUser = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { username, nickname, initialPoints } = req.body;

    // 验证参数
    if (!username || initialPoints === undefined || initialPoints === null) {
      return error(res, '用户名和初始积分为必填项', 400);
    }

    if (username.length < 3 || username.length > 50) {
      return error(res, '用户名长度必须在3-50个字符之间', 400);
    }

    if (initialPoints < 0) {
      return error(res, '初始积分不能为负数', 400);
    }

    // 检查用户名是否已存在
    const existingUser = await User.findOne({
      where: { username }
    });

    if (existingUser) {
      return error(res, '用户名已存在', 400);
    }

    // 生成随机密码（8位包含字母和数字）
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // 创建用户
    const user = await User.create({
      username,
      password: hashedPassword,
      nickname: nickname || null,
      role: 'user'
    });

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    // 创建关联（自动approved状态）
    await UserTenantRelation.create({
      userId: user.id,
      tenantId,
      status: 'approved',
      pointsBalance: initialPoints
    });

    logger.info(`运营方 ${operatorId} 创建新用户 ${user.id}`);

    return success(res, {
      id: user.id,
      username: user.username,
      nickname: user.nickname,
      password: randomPassword // 返回随机密码供运营方告知用户
    }, '用户创建成功');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`创建新用户失败: ${errorMsg}`);
    return error(res, errorMsg || '创建失败', 500);
  }
};

/**
 * 用户列表
 */
exports.getUsers = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { page = 1, pageSize = 20, keyword } = req.query;
    const offset = (page - 1) * pageSize;

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    // 构建查询条件
    const where = {
      tenantId,
      isDeleted: 0
    };

    // 关键词搜索
    let includeWhere = {};
    if (keyword) {
      includeWhere.username = { [Op.like]: `%${keyword}%` };
    }

    const { count, rows } = await UserTenantRelation.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          where: includeWhere,
          attributes: ['id', 'username', 'nickname']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: offset
    });

    return success(res, {
      list: rows.map(item => ({
        ...item.toJSON(),
        username: item.user?.username,
        nickname: item.user?.nickname
      })),
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取用户列表失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 用户详情
 */
exports.getUserDetail = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { userId } = req.params;

    const tenantId = await getOperatorTenantId(operatorId);

    const relation = await UserTenantRelation.findOne({
      where: {
        userId,
        tenantId,
        isDeleted: 0
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname', 'role', 'status']
        }
      ]
    });

    if (!relation) {
      return error(res, '用户不存在或不属于此租户', 404);
    }

    return success(res, relation);
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取用户详情失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 移除用户（逻辑删除）
 */
exports.removeUser = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { userId } = req.params;

    const tenantId = await getOperatorTenantId(operatorId);

    const relation = await UserTenantRelation.findOne({
      where: {
        userId,
        tenantId,
        isDeleted: 0
      }
    });

    if (!relation) {
      return error(res, '用户不存在或不属于此租户', 404);
    }

    // 逻辑删除
    await relation.update({
      isDeleted: 1,
      deletedAt: new Date()
    });

    logger.info(`运营方 ${operatorId} 移除用户 ${userId} 从租户 ${tenantId}`);

    return success(res, null, '用户已移除');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`移除用户失败: ${errorMsg}`);
    return error(res, errorMsg || '移除失败', 500);
  }
};

/**
 * 恢复用户
 */
exports.restoreUser = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { userId } = req.params;

    const tenantId = await getOperatorTenantId(operatorId);

    const relation = await UserTenantRelation.findOne({
      where: {
        userId,
        tenantId,
        isDeleted: 1
      }
    });

    if (!relation) {
      return error(res, '用户不存在或不属于回收站', 404);
    }

    // 恢复
    await relation.update({
      isDeleted: 0,
      deletedAt: null
    });

    logger.info(`运营方 ${operatorId} 恢复用户 ${userId}`);

    return success(res, null, '用户已恢复');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`恢复用户失败: ${errorMsg}`);
    return error(res, errorMsg || '恢复失败', 500);
  }
};

/**
 * 回收站 - 已移除用户列表
 */
exports.getTrashUsers = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const tenantId = await getOperatorTenantId(operatorId);

    const { count, rows } = await UserTenantRelation.findAndCountAll({
      where: {
        tenantId,
        isDeleted: 1
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname']
        }
      ],
      order: [['deletedAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: offset
    });

    return success(res, {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取回收站用户失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 重置用户密码（生成随机密码）
 */
exports.resetUserPassword = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { userId } = req.params;

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    // 验证用户是否属于当前租户
    const relation = await UserTenantRelation.findOne({
      where: {
        userId,
        tenantId,
        isDeleted: 0
      }
    });

    if (!relation) {
      return error(res, '用户不存在或不属于此租户', 404);
    }

    // 生成随机密码（8位包含字母和数字）
    const randomPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(randomPassword, 10);

    // 更新密码
    await User.update(
      { password: hashedPassword },
      { where: { id: userId } }
    );

    logger.info(`运营方 ${operatorId} 重置用户 ${userId} 的密码`);

    return success(res, {
      password: randomPassword
    }, '密码重置成功');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`重置密码失败: ${errorMsg}`);
    return error(res, errorMsg || '重置失败', 500);
  }
};

/**
 * 获取待审核的申请列表
 */
exports.getPendingApplications = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    const { count, rows } = await UserTenantRelation.findAndCountAll({
      where: {
        tenantId,
        status: 'pending',
        isDeleted: 0
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: offset
    });

    return success(res, {
      list: rows,
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取待审核申请失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 审核通过
 */
exports.approveApplication = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { relationId } = req.params;

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    // 查找申请记录
    const relation = await UserTenantRelation.findOne({
      where: {
        id: relationId,
        tenantId,
        status: 'pending',
        isDeleted: 0
      }
    });

    if (!relation) {
      return error(res, '申请记录不存在', 404);
    }

    // 更新状态
    await relation.update({
      status: 'approved',
      pointsBalance: 0
    });

    logger.info(`运营方 ${operatorId} 审核通过用户 ${relation.userId} 的申请`);

    return success(res, null, '审核通过');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`审核通过失败: ${errorMsg}`);
    return error(res, errorMsg || '操作失败', 500);
  }
};

/**
 * 审核拒绝
 */
exports.rejectApplication = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { relationId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return error(res, '请填写拒绝理由', 400);
    }

    // 获取租户ID
    const tenantId = await getOperatorTenantId(operatorId);

    // 查找申请记录
    const relation = await UserTenantRelation.findOne({
      where: {
        id: relationId,
        tenantId,
        status: 'pending',
        isDeleted: 0
      }
    });

    if (!relation) {
      return error(res, '申请记录不存在', 404);
    }

    // 更新状态和拒绝理由
    await relation.update({
      status: 'rejected',
      rejectReason: reason
    });

    logger.info(`运营方 ${operatorId} 拒绝用户 ${relation.userId} 的申请`);

    return success(res, null, '已拒绝');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`审核拒绝失败: ${errorMsg}`);
    return error(res, errorMsg || '操作失败', 500);
  }
};

