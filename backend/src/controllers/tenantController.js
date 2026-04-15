const { Tenant, UserTenantRelation } = require('../models');
const { Op } = require('sequelize');
const logger = require('../middlewares/logger');

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

