const { Tenant, UserTenantRelation, Product } = require('../models');
const { Op } = require('sequelize');
const { logger } = require('../middlewares/logger');
const { success, error } = require('../utils/response');

/**
 * 获取租户列表（根据角色返回不同数据）
 */
exports.getTenants = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (page - 1) * pageSize;
    const userRole = req.user.role;
    const userId = req.user.id;

    let where = {};
    
    // 根据角色过滤
    if (userRole === 'operator') {
      // operator只能看到自己的租户
      const tenant = await Tenant.findOne({
        where: { userId, isDeleted: 0 }
      });
      
      if (!tenant) {
        return res.json({
          code: 200,
          message: 'success',
          data: {
            list: [],
            total: 0,
            page: parseInt(page),
            pageSize: parseInt(pageSize)
          }
        });
      }
      
      where = { id: tenant.id };
    } else if (userRole === 'user') {
      // user只能看到已审核通过的租户
      where = { status: 'approved', isDeleted: 0 };
    } else if (userRole === 'admin') {
      // admin可以看到所有租户（排除已删除的）
      where = { isDeleted: 0 };
    }

    // 状态筛选
    if (status && ['pending', 'approved', 'rejected', 'disabled'].includes(status)) {
      where.status = status;
    }

    const { count, rows } = await Tenant.findAndCountAll({
      where,
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

    return res.json({
      code: 200,
      message: 'success',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取租户列表失败: ${errorMsg}`);
    console.error('完整错误:', err);
    return res.status(500).json({
      code: 500,
      message: errorMsg || '服务器内部错误'
    });
  }
};

/**
 * 获取运营方自己的租户审核状态
 */
exports.getMyTenantStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const tenant = await Tenant.findOne({
      where: { userId, isDeleted: 0 },
      include: [
        {
          model: require('../models').User,
          as: 'user',
          attributes: ['id', 'username', 'nickname']
        }
      ]
    });

    if (!tenant) {
      return error(res, '租户不存在', 404);
    }

    return success(res, tenant);
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取租户状态失败: ${errorMsg}`);
    return error(res, errorMsg || '服务器内部错误', 500);
  }
};

/**
 * 运营方重新提交审核
 */
exports.resubmitAudit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, description } = req.body;

    // 参数验证
    if (!name) {
      return error(res, '租户名称不能为空', 400);
    }

    const tenant = await Tenant.findOne({
      where: { userId, isDeleted: 0 }
    });

    if (!tenant) {
      return error(res, '租户不存在', 404);
    }

    // 只有被拒绝的才能重新提交
    if (tenant.status !== 'rejected') {
      return error(res, '只有被拒绝的申请才能重新提交', 400);
    }

    // 更新租户信息并重新设置为待审核
    await tenant.update({
      name,
      description: description || tenant.description,
      status: 'pending',
      rejectReason: null // 清空拒绝原因
    });

    logger.info(`运营方重新提交审核，租户ID: ${tenant.id}`);
    return success(res, tenant, '重新提交成功，请等待审核');
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`重新提交审核失败: ${errorMsg}`);
    return error(res, errorMsg || '服务器内部错误', 500);
  }
};

/**
 * 获取租户详情
 */
exports.getTenantById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const tenant = await Tenant.findByPk(id, {
      include: [
        {
          model: require('../models').User,
          as: 'user',
          attributes: ['id', 'username', 'nickname']
        }
      ]
    });

    if (!tenant) {
      return res.status(404).json({
        code: 404,
        message: '租户不存在'
      });
    }

    return res.json({
      code: 200,
      message: 'success',
      data: tenant
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取租户详情失败: ${errorMsg}`);
    return res.status(500).json({
      code: 500,
      message: errorMsg || '服务器内部错误'
    });
  }
};

/**
 * 获取指定租户的商品列表（用户端）
 */
exports.getTenantProducts = async (req, res) => {
  try {
    const { id: tenantId } = req.params;
    const { page = 1, pageSize = 20, keyword, category } = req.query;
    const userId = req.user.id;
    const offset = (page - 1) * pageSize;

    // 检查用户是否已加入该租户
    const relation = await UserTenantRelation.findOne({
      where: {
        userId,
        tenantId,
        status: 'approved'
      }
    });

    if (!relation) {
      return res.status(403).json({
        code: 403,
        message: '您还不是该运营方的成员'
      });
    }

    // 构建查询条件
    const where = {
      tenantId,
      status: 'active',
      isDeleted: 0
    };

    // 商品名称搜索
    if (keyword) {
      where.name = { [Op.like]: `%${keyword}%` };
    }

    // 分类筛选
    if (category) {
      where.category = category;
    }

    // 查询该租户的上架商品
    const { count, rows } = await Product.findAndCountAll({
      where,
      order: [['createdAt', 'DESC']],
      limit: parseInt(pageSize),
      offset: offset
    });

    return res.json({
      code: 200,
      message: 'success',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      }
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取租户商品失败: ${errorMsg}`);
    return res.status(500).json({
      code: 500,
      message: errorMsg || '服务器内部错误'
    });
  }
};

