const { Tenant, UserTenantRelation, PointTransaction } = require('../models');
const logger = require('../middlewares/logger');
const { success, error } = require('../utils/response');

/**
 * 运营方列表（用户视角）
 */
exports.getTenantsForUser = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    // 只返回已审核通过的租户
    const { count, rows } = await Tenant.findAndCountAll({
      where: {
        status: 'approved',
        isDeleted: 0
      },
      include: [
        {
          model: require('../models').User,
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
    logger.error(`获取运营方列表失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 申请加入运营方
 */
exports.applyJoinTenant = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tenantId } = req.params;

    // 验证租户是否存在且已审核通过
    const tenant = await Tenant.findByPk(tenantId);

    if (!tenant) {
      return error(res, '运营方不存在', 404);
    }

    if (tenant.status !== 'approved') {
      return error(res, '该运营方暂未通过审核', 400);
    }

    // 检查是否已经申请过
    const existingRelation = await UserTenantRelation.findOne({
      where: {
        userId,
        tenantId
      }
    });

    if (existingRelation) {
      if (existingRelation.isDeleted === 1) {
        // 之前被移除过，可以重新申请
        await existingRelation.update({
          status: 'pending',
          isDeleted: 0,
          deletedAt: null,
          pointsBalance: 0
        });
        
        logger.info(`用户 ${userId} 重新申请加入租户 ${tenantId}`);
        return success(res, null, '申请已提交，请等待审核');
      } else {
        return error(res, `您已经${existingRelation.status === 'approved' ? '加入' : '申请过'}该运营方`, 400);
      }
    }

    // 创建申请记录
    await UserTenantRelation.create({
      userId,
      tenantId,
      status: 'pending',
      pointsBalance: 0
    });

    logger.info(`用户 ${userId} 申请加入租户 ${tenantId}`);

    return success(res, null, '申请已提交，请等待审核');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`申请加入运营方失败: ${errorMsg}`);
    return error(res, errorMsg || '申请失败', 500);
  }
};

/**
 * 查看我的申请
 */
exports.getMyApplications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20 } = req.query;
    const offset = (page - 1) * pageSize;

    const { count, rows } = await UserTenantRelation.findAndCountAll({
      where: {
        userId,
        isDeleted: 0
      },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name', 'description', 'status'],
          include: [
            {
              model: require('../models').User,
              as: 'user',
              attributes: ['id', 'username', 'nickname']
            }
          ]
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
    logger.error(`获取申请列表失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 切换运营方视角
 */
exports.switchTenant = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tenantId } = req.params;

    // 验证用户是否已加入该租户
    const relation = await UserTenantRelation.findOne({
      where: {
        userId,
        tenantId,
        status: 'approved',
        isDeleted: 0
      }
    });

    if (!relation) {
      return error(res, '您还未加入该运营方或申请未通过', 403);
    }

    return success(res, {
      tenantId,
      pointsBalance: relation.pointsBalance
    }, '切换成功');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`切换运营方失败: ${errorMsg}`);
    return error(res, errorMsg || '切换失败', 500);
  }
};

/**
 * 查看当前积分
 */
exports.getCurrentPoints = async (req, res) => {
  try {
    const userId = req.user.id;
    const { tenantId } = req.query;

    if (!tenantId) {
      return error(res, '请提供租户ID', 400);
    }

    // 验证用户是否属于该租户
    const relation = await UserTenantRelation.findOne({
      where: {
        userId,
        tenantId,
        status: 'approved',
        isDeleted: 0
      },
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name']
        }
      ]
    });

    if (!relation) {
      return error(res, '您不属于该运营方', 403);
    }

    return success(res, {
      tenantId,
      tenantName: relation.tenant?.name,
      pointsBalance: relation.pointsBalance
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取积分信息失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

/**
 * 查看积分流水
 */
exports.getPointTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20, tenantId, startDate, endDate, transactionType } = req.query;
    const offset = (page - 1) * pageSize;

    if (!tenantId) {
      return error(res, '请提供租户ID', 400);
    }

    // 验证用户是否属于该租户
    const relation = await UserTenantRelation.findOne({
      where: {
        userId,
        tenantId,
        status: 'approved',
        isDeleted: 0
      }
    });

    if (!relation) {
      return error(res, '您不属于该运营方', 403);
    }

    // 构建查询条件
    const { Op } = require('sequelize');
    const where = {
      userId,
      tenantId
    };

    if (transactionType && ['add', 'subtract', 'modify', 'exchange'].includes(transactionType)) {
      where.transactionType = transactionType;
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt[Op.gte] = new Date(startDate);
      }
      if (endDate) {
        where.createdAt[Op.lte] = new Date(endDate);
      }
    }

    const { count, rows } = await PointTransaction.findAndCountAll({
      where,
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
    logger.error(`获取积分流水失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

