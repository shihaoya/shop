const { User, Tenant, UserTenantRelation, PointTransaction } = require('../models');
const { Op } = require('sequelize');
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
 * 辅助函数：验证用户是否属于当前租户
 */
async function validateUserInTenant(userId, tenantId) {
  const relation = await UserTenantRelation.findOne({
    where: {
      userId,
      tenantId,
      isDeleted: 0
    }
  });

  if (!relation) {
    throw new Error('用户不属于此租户');
  }

  return relation;
}

/**
 * 辅助函数：记录积分流水
 */
async function createPointTransaction({
  userId,
  tenantId,
  transactionType,
  pointsChange,
  balanceAfter,
  reason,
  operatorId,
  operatorName,
  relatedOrderId = null
}) {
  return await PointTransaction.create({
    userId,
    tenantId,
    transactionType,
    pointsChange,
    balanceAfter,
    reason,
    operatorId,
    operatorName,
    relatedOrderId
  });
}

/**
 * 用户积分列表
 */
exports.getPointsUsers = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { page = 1, pageSize = 20, keyword } = req.query;
    const offset = (page - 1) * pageSize;

    const tenantId = await getOperatorTenantId(operatorId);

    // 构建查询条件
    const where = {
      tenantId,
      isDeleted: 0
    };

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
      order: [['pointsBalance', 'DESC']],
      limit: parseInt(pageSize),
      offset: offset
    });

    return success(res, {
      list: rows.map(item => ({
        id: item.userId,
        username: item.user?.username,
        nickname: item.user?.nickname,
        pointsBalance: item.pointsBalance
      })),
      total: count,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取用户积分列表失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 增加积分
 */
exports.addPoints = async (req, res) => {
  const transaction = await UserTenantRelation.sequelize.transaction();

  try {
    const operatorId = req.user.id;
    const { userId } = req.params;
    const { points, reason } = req.body;

    // 验证参数
    if (!points || !reason) {
      await transaction.rollback();
      return error(res, '积分数量和原因为必填项', 400);
    }

    if (points <= 0) {
      await transaction.rollback();
      return error(res, '积分数量必须大于0', 400);
    }

    const tenantId = await getOperatorTenantId(operatorId);
    const relation = await validateUserInTenant(userId, tenantId);

    // 更新积分余额
    const newBalance = relation.pointsBalance + points;
    await relation.update(
      { pointsBalance: newBalance },
      { transaction }
    );

    // 记录流水
    await createPointTransaction({
      userId,
      tenantId,
      transactionType: 'add',
      pointsChange: points,
      balanceAfter: newBalance,
      reason,
      operatorId,
      operatorName: req.user.username
    });

    await transaction.commit();

    logger.info(`运营方 ${operatorId} 给用户 ${userId} 增加 ${points} 积分`);

    return success(res, {
      userId,
      oldBalance: relation.pointsBalance - points,
      newBalance,
      pointsChange: points
    }, '积分增加成功');
  } catch (err) {
    await transaction.rollback();
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`增加积分失败: ${errorMsg}`);
    
    // 根据错误类型返回不同的状态码
    let statusCode = 500;
    if (errorMsg.includes('不属于此租户') || errorMsg.includes('不存在')) {
      statusCode = 404;
    } else if (errorMsg.includes('必填') || errorMsg.includes('必须')) {
      statusCode = 400;
    }
    
    return error(res, errorMsg || '操作失败', statusCode);
  }
};

/**
 * 减少积分
 */
exports.subtractPoints = async (req, res) => {
  const transaction = await UserTenantRelation.sequelize.transaction();

  try {
    const operatorId = req.user.id;
    const { userId } = req.params;
    const { points, reason } = req.body;

    // 验证参数
    if (!points || !reason) {
      await transaction.rollback();
      return error(res, '积分数量和原因为必填项', 400);
    }

    if (points <= 0) {
      await transaction.rollback();
      return error(res, '积分数量必须大于0', 400);
    }

    const tenantId = await getOperatorTenantId(operatorId);
    const relation = await validateUserInTenant(userId, tenantId);

    // 检查余额是否充足
    if (relation.pointsBalance < points) {
      await transaction.rollback();
      return error(res, `积分余额不足，当前余额：${relation.pointsBalance}`, 400);
    }

    // 更新积分余额
    const newBalance = relation.pointsBalance - points;
    await relation.update(
      { pointsBalance: newBalance },
      { transaction }
    );

    // 记录流水
    await createPointTransaction({
      userId,
      tenantId,
      transactionType: 'subtract',
      pointsChange: -points,
      balanceAfter: newBalance,
      reason,
      operatorId,
      operatorName: req.user.username
    });

    await transaction.commit();

    logger.info(`运营方 ${operatorId} 给用户 ${userId} 减少 ${points} 积分`);

    return success(res, {
      userId,
      oldBalance: relation.pointsBalance + points,
      newBalance,
      pointsChange: -points
    }, '积分减少成功');
  } catch (err) {
    await transaction.rollback();
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`减少积分失败: ${errorMsg}`);
    
    let statusCode = 500;
    if (errorMsg.includes('不属于此租户') || errorMsg.includes('不存在')) {
      statusCode = 404;
    } else if (errorMsg.includes('必填') || errorMsg.includes('必须') || errorMsg.includes('不足')) {
      statusCode = 400;
    }
    
    return error(res, errorMsg || '操作失败', statusCode);
  }
};

/**
 * 修改积分
 */
exports.modifyPoints = async (req, res) => {
  const transaction = await UserTenantRelation.sequelize.transaction();

  try {
    const operatorId = req.user.id;
    const { userId } = req.params;
    const { newPoints, reason } = req.body;

    // 验证参数
    if (newPoints === undefined || !reason) {
      await transaction.rollback();
      return error(res, '新积分值和原因为必填项', 400);
    }

    if (newPoints < 0) {
      await transaction.rollback();
      return error(res, '积分不能为负数', 400);
    }

    const tenantId = await getOperatorTenantId(operatorId);
    const relation = await validateUserInTenant(userId, tenantId);

    const oldBalance = relation.pointsBalance;
    const pointsChange = newPoints - oldBalance;

    // 如果积分没有变化，直接返回
    if (pointsChange === 0) {
      await transaction.rollback();
      return success(res, {
        userId,
        oldBalance,
        newBalance: newPoints,
        pointsChange: 0
      }, '积分未发生变化');
    }

    // 更新积分余额
    await relation.update(
      { pointsBalance: newPoints },
      { transaction }
    );

    // 记录流水
    await createPointTransaction({
      userId,
      tenantId,
      transactionType: 'modify',
      pointsChange,
      balanceAfter: newPoints,
      reason,
      operatorId,
      operatorName: req.user.username
    });

    await transaction.commit();

    logger.info(`运营方 ${operatorId} 修改用户 ${userId} 积分从 ${oldBalance} 到 ${newPoints}`);

    return success(res, {
      userId,
      oldBalance,
      newBalance: newPoints,
      pointsChange
    }, '积分修改成功');
  } catch (err) {
    await transaction.rollback();
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`修改积分失败: ${errorMsg}`);
    
    let statusCode = 500;
    if (errorMsg.includes('不属于此租户') || errorMsg.includes('不存在')) {
      statusCode = 404;
    } else if (errorMsg.includes('必填') || errorMsg.includes('必须')) {
      statusCode = 400;
    }
    
    return error(res, errorMsg || '操作失败', statusCode);
  }
};

/**
 * 批量调整积分
 */
exports.batchAdjustPoints = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { userIds, adjustType, points, reason } = req.body;

    // 验证参数
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return error(res, '用户ID列表不能为空', 400);
    }

    if (!['add', 'subtract', 'modify'].includes(adjustType)) {
      return error(res, '调整类型无效', 400);
    }

    if (!points || points <= 0) {
      return error(res, '积分数量必须大于0', 400);
    }

    if (!reason) {
      return error(res, '原因为必填项', 400);
    }

    const tenantId = await getOperatorTenantId(operatorId);

    const results = {
      total: userIds.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // 逐个处理每个用户
    for (const userId of userIds) {
      try {
        const transaction = await UserTenantRelation.sequelize.transaction();

        try {
          const relation = await validateUserInTenant(userId, tenantId);

          let newBalance;
          let pointsChange;

          if (adjustType === 'add') {
            newBalance = relation.pointsBalance + points;
            pointsChange = points;
          } else if (adjustType === 'subtract') {
            if (relation.pointsBalance < points) {
              await transaction.rollback();
              results.failed++;
              results.errors.push({
                userId,
                reason: `积分余额不足，当前余额：${relation.pointsBalance}`
              });
              continue;
            }
            newBalance = relation.pointsBalance - points;
            pointsChange = -points;
          } else {
            // modify
            newBalance = points;
            pointsChange = points - relation.pointsBalance;
          }

          // 更新积分
          await relation.update(
            { pointsBalance: newBalance },
            { transaction }
          );

          // 记录流水
          await createPointTransaction({
            userId,
            tenantId,
            transactionType: adjustType,
            pointsChange,
            balanceAfter: newBalance,
            reason,
            operatorId,
            operatorName: req.user.username
          });

          await transaction.commit();
          results.success++;
        } catch (err) {
          await transaction.rollback();
          results.failed++;
          results.errors.push({
            userId,
            reason: err.message
          });
        }
      } catch (err) {
        results.failed++;
        results.errors.push({
          userId,
          reason: err.message
        });
      }
    }

    logger.info(`运营方 ${operatorId} 批量调整积分: 成功${results.success}, 失败${results.failed}`);

    return success(res, results, '批量调整完成');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`批量调整积分失败: ${errorMsg}`);
    return error(res, errorMsg || '操作失败', 500);
  }
};

/**
 * 用户积分流水
 */
exports.getPointTransactions = async (req, res) => {
  try {
    const operatorId = req.user.id;
    const { userId } = req.params;
    const { page = 1, pageSize = 20, startDate, endDate, transactionType } = req.query;
    const offset = (page - 1) * pageSize;

    const tenantId = await getOperatorTenantId(operatorId);
    await validateUserInTenant(userId, tenantId);

    // 构建查询条件
    const where = {
      userId,
      tenantId
    };

    if (transactionType && ['add', 'subtract', 'modify', 'exchange'].includes(transactionType)) {
      where.transactionType = transactionType;
    }

    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) {
        where.created_at[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.created_at[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows } = await PointTransaction.findAndCountAll({
      where,
      order: [['created_at', 'DESC']],
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
    logger.error(`获取积分流水失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

