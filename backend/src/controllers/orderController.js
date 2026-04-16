const { Order, Product, User, Tenant, PointTransaction } = require('../models');
const MessageService = require('../services/messageService');
const { Op } = require('sequelize');
const { logger } = require('../middlewares/logger');

/**
 * 生成订单号
 */
const generateOrderNo = () => {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `ORD${timestamp}${random}`;
};

/**
 * 用户兑换商品（创建订单）
 */
exports.createOrder = async (req, res) => {
  try {
    const userId = req.user.id;
    const { productId, quantity = 1, recipientName, recipientPhone, recipientAddress, remark } = req.body;

    // 参数验证
    if (!productId || quantity < 1) {
      return res.status(400).json({
        code: 400,
        message: '参数错误'
      });
    }

    // 查询商品信息
    const product = await Product.findByPk(productId);
    if (!product || product.isDeleted === 1) {
      return res.status(404).json({
        code: 404,
        message: '商品不存在或已下架'
      });
    }

    // 检查库存
    if (product.stock < quantity) {
      return res.status(400).json({
        code: 400,
        message: `库存不足，当前库存：${product.stock}`
      });
    }

    // 获取用户在租户下的积分
    const userTenantRelation = await require('../models').UserTenantRelation.findOne({
      where: {
        userId,
        tenantId: product.tenantId,
        status: 'approved',
        isDeleted: 0
      }
    });

    if (!userTenantRelation) {
      return res.status(403).json({
        code: 403,
        message: '您不是该运营方的成员'
      });
    }

    const totalPoints = product.pointsRequired * quantity;

    // 检查积分是否足够
    if (userTenantRelation.pointsBalance < totalPoints) {
      return res.status(400).json({
        code: 400,
        message: `积分不足，需要 ${totalPoints} 积分，当前余额 ${userTenantRelation.pointsBalance} 积分`
      });
    }

    // 开启事务
    const transaction = await require('../models').sequelize.transaction();

    try {
      // 1. 创建订单
      const order = await Order.create({
        orderNo: generateOrderNo(),
        userId,
        tenantId: product.tenantId,
        productId,
        productName: product.name,
        pointsCost: product.pointsRequired,
        quantity,
        totalPoints,
        status: 'pending',
        recipientName: recipientName || null,
        recipientPhone: recipientPhone || null,
        recipientAddress: recipientAddress || null,
        remark: remark || null
      }, { transaction });

      // 2. 扣减库存
      await product.decrement('stock', { by: quantity, transaction });

      // 3. 扣减用户积分
      await userTenantRelation.decrement('pointsBalance', { by: totalPoints, transaction });

      // 4. 记录积分流水
      await PointTransaction.create({
        userId,
        tenantId: product.tenantId,
        transactionType: 'exchange',
        pointsChange: -totalPoints,
        balanceAfter: userTenantRelation.pointsBalance - totalPoints,
        reason: `兑换商品：${product.name} x${quantity}`,
        operatorId: userId,
        relatedOrderId: order.id
      }, { transaction });

      await transaction.commit();

      logger.info(`用户 ${userId} 成功创建订单 ${order.orderNo}，消耗积分：${totalPoints}`);

      // 发送订单创建成功消息
      MessageService.notifyOrderCreated(order);

      return res.json({
        code: 200,
        message: '兑换成功',
        data: order
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (err) {
    logger.error('创建订单失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

/**
 * 获取我的订单列表（用户视角）
 */
exports.getMyOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20, status, tenantId } = req.query;
    const offset = (page - 1) * pageSize;

    let where = { userId, isDeleted: 0 };

    // 状态筛选
    if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
      where.status = status;
    }

    // 租户筛选
    if (tenantId) {
      where.tenantId = tenantId;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'imageUrl']
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
    logger.error('获取订单列表失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

/**
 * 获取订单详情
 */
exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    let where = { id, isDeleted: 0 };

    // 普通用户只能查看自己的订单
    if (userRole === 'user') {
      where.userId = userId;
    }

    const order = await Order.findOne({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname']
        },
        {
          model: Tenant,
          as: 'tenant',
          attributes: ['id', 'name']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'imageUrl']
        }
      ]
    });

    if (!order) {
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }

    return res.json({
      code: 200,
      message: 'success',
      data: order
    });
  } catch (err) {
    logger.error('获取订单详情失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

/**
 * 运营方查看订单列表
 */
exports.getOperatorOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20, status } = req.query;
    const offset = (page - 1) * pageSize;

    // 获取运营方的租户ID
    const tenant = await Tenant.findOne({
      where: { userId, isDeleted: 0 }
    });

    if (!tenant) {
      return res.json({
        code: 200,
        message: 'success',
        data: { list: [], total: 0, page: parseInt(page), pageSize: parseInt(pageSize) }
      });
    }

    let where = { tenantId: tenant.id, isDeleted: 0 };

    // 状态筛选
    if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
      where.status = status;
    }

    const { count, rows } = await Order.findAndCountAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['id', 'name', 'imageUrl']
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
    logger.error('获取运营方订单列表失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

/**
 * 导出订单为CSV文件
 */
exports.exportOrders = async (req, res) => {
  try {
    const userId = req.user.id;
    const { status, startDate, endDate } = req.query;

    // 获取运营方的租户ID
    const tenant = await Tenant.findOne({
      where: { userId, isDeleted: 0 }
    });

    if (!tenant) {
      return res.status(403).json({
        code: 403,
        message: '无权操作'
      });
    }

    // 构建查询条件
    let where = { tenantId: tenant.id, isDeleted: 0 };

    if (status && ['pending', 'completed', 'cancelled'].includes(status)) {
      where.status = status;
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

    // 查询订单（限制最多10000条）
    const orders = await Order.findAll({
      where,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['username', 'nickname']
        },
        {
          model: Product,
          as: 'product',
          attributes: ['name']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 10000
    });

    if (orders.length === 0) {
      return res.status(404).json({
        code: 404,
        message: '没有可导出的订单'
      });
    }

    // 生成CSV内容
    const headers = [
      '订单号',
      '用户名',
      '昵称',
      '商品名称',
      '积分单价',
      '数量',
      '总积分',
      '收货人',
      '联系电话',
      '收货地址',
      '订单状态',
      '备注',
      '下单时间'
    ];

    const statusMap = {
      pending: '待处理',
      completed: '已完成',
      cancelled: '已取消'
    };

    const rows = orders.map(order => {
      return [
        order.orderNo,
        order.user?.username || '',
        order.user?.nickname || '',
        order.productName,
        order.pointsCost,
        order.quantity,
        order.totalPoints,
        order.recipientName || '',
        order.recipientPhone || '',
        order.recipientAddress || '',
        statusMap[order.status] || order.status,
        order.remark || '',
        new Date(order.createdAt).toLocaleString('zh-CN')
      ];
    });

    // 组合CSV内容
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    // 设置响应头
    const filename = `订单导出_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv;charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(filename)}`);
    
    // 添加BOM以支持中文
    res.write('\uFEFF');
    res.end(csvContent);

    logger.info(`运营方 ${userId} 导出订单 ${orders.length} 条`);
  } catch (err) {
    logger.error('导出订单失败:', err);
    return res.status(500).json({
      code: 500,
      message: '导出失败'
    });
  }
};

/**
 * 更新订单状态（运营方操作）
 */
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark } = req.body;
    const operatorId = req.user.id;

    // 验证状态
    if (!['completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        code: 400,
        message: '无效的状态值'
      });
    }

    // 获取运营方的租户ID
    const tenant = await Tenant.findOne({
      where: { userId: operatorId, isDeleted: 0 }
    });

    if (!tenant) {
      return res.status(403).json({
        code: 403,
        message: '无权操作'
      });
    }

    // 查询订单
    const order = await Order.findOne({
      where: { id, tenantId: tenant.id, isDeleted: 0 }
    });

    if (!order) {
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }

    // 更新订单状态
    const oldStatus = order.status;
    order.status = status;
    if (remark) {
      order.remark = remark;
    }
    await order.save();

    logger.info(`运营方 ${operatorId} 更新订单 ${order.orderNo} 状态为 ${status}`);

    // 发送消息通知用户
    MessageService.notifyUserOrderStatusChange(order, oldStatus, status);

    return res.json({
      code: 200,
      message: '更新成功',
      data: order
    });
  } catch (err) {
    logger.error('更新订单状态失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

/**
 * 取消订单（用户操作）
 */
exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // 查询订单
    const order = await Order.findOne({
      where: { id, userId, isDeleted: 0 }
    });

    if (!order) {
      return res.status(404).json({
        code: 404,
        message: '订单不存在'
      });
    }

    // 只有待处理状态可以取消
    if (order.status !== 'pending') {
      return res.status(400).json({
        code: 400,
        message: '当前状态无法取消'
      });
    }

    // 开启事务
    const transaction = await require('../models').sequelize.transaction();

    try {
      // 1. 更新订单状态
      order.status = 'cancelled';
      await order.save({ transaction });

      // 2. 恢复库存
      const product = await Product.findByPk(order.productId, { transaction });
      if (product) {
        await product.increment('stock', { by: order.quantity, transaction });
      }

      // 3. 恢复用户积分
      const userTenantRelation = await require('../models').UserTenantRelation.findOne({
        where: {
          userId,
          tenantId: order.tenantId,
          status: 'approved',
          isDeleted: 0
        },
        transaction
      });

      if (userTenantRelation) {
        await userTenantRelation.increment('pointsBalance', { by: order.totalPoints, transaction });

        // 4. 记录积分流水
        await PointTransaction.create({
          userId,
          tenantId: order.tenantId,
          transactionType: 'subtract',
          pointsChange: order.totalPoints,
          balanceAfter: userTenantRelation.pointsBalance + order.totalPoints,
          reason: `订单取消退款：${order.orderNo}`,
          operatorId: userId,
          relatedOrderId: order.id
        }, { transaction });
      }

      await transaction.commit();

      logger.info(`用户 ${userId} 取消订单 ${order.orderNo}`);

      // 发送订单取消消息
      MessageService.notifyOrderCancelled(order);

      return res.json({
        code: 200,
        message: '订单已取消',
        data: order
      });
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  } catch (err) {
    logger.error('取消订单失败:', err);
    return res.status(500).json({
      code: 500,
      message: '服务器错误'
    });
  }
};

