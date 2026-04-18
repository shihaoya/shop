const { Product, UserTenantRelation, PointTransaction, Tenant } = require('../models');
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
 * 获取运营方工作台统计数据
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // 获取租户ID
    const tenantId = await getOperatorTenantId(userId);
    
    // 1. 商品总数
    const totalProducts = await Product.count({
      where: {
        tenantId,
        isDeleted: 0
      }
    });
    
    // 2. 在售商品数
    const onlineProducts = await Product.count({
      where: {
        tenantId,
        status: 'on_shelf',
        isDeleted: 0
      }
    });
    
    // 3. 用户总数（已审核通过的用户）
    const totalUsers = await UserTenantRelation.count({
      where: {
        tenantId,
        status: 'approved',
        isDeleted: 0
      }
    });
    
    // 4. 发放积分总数（所有增加的积分流水总和）
    const pointsResult = await PointTransaction.sum('pointsChange', {
      where: {
        tenantId,
        transactionType: 'add',
        pointsChange: { [Op.gt]: 0 }
      }
    });
    const totalPoints = pointsResult || 0;
    
    logger.info(`运营方 ${userId} 获取工作台统计数据`);
    
    return success(res, {
      totalProducts,
      onlineProducts,
      totalUsers,
      totalPoints
    });
  } catch (err) {
    const errorMsg = err.original ? err.original.message : (err.message || '未知错误');
    logger.error(`获取工作台统计数据失败: ${errorMsg}`);
    return error(res, errorMsg || '获取失败', 500);
  }
};

