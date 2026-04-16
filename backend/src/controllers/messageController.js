const { Message, User } = require('../models');
const MessageService = require('../services/messageService');
const { Op } = require('sequelize');
const { logger } = require('../middlewares/logger');
const { success, error } = require('../utils/response');

/**
 * 获取用户消息列表
 */
exports.getMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20, isRead, type } = req.query;
    const offset = (page - 1) * pageSize;

    // 构建查询条件
    const where = {
      userId,
      isDeleted: 0
    };

    if (isRead !== undefined) {
      where.isRead = parseInt(isRead);
    }

    if (type && ['system', 'order', 'point', 'audit', 'announcement'].includes(type)) {
      where.type = type;
    }

    const { count, rows } = await Message.findAndCountAll({
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
    logger.error(`获取消息列表失败: ${err.message}`);
    return error(res, '获取失败', 500);
  }
};

/**
 * 标记消息已读
 */
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      where: { id, userId, isDeleted: 0 }
    });

    if (!message) {
      return error(res, '消息不存在', 404);
    }

    if (message.isRead === 1) {
      return success(res, null, '消息已是已读状态');
    }

    await message.update({
      isRead: 1,
      readAt: new Date()
    });

    return success(res, null, '标记成功');
  } catch (err) {
    logger.error(`标记消息已读失败: ${err.message}`);
    return error(res, '操作失败', 500);
  }
};

/**
 * 批量标记已读
 */
exports.markBatchAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageIds } = req.body;

    let result;
    
    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      // 标记指定消息
      result = await Message.update(
        { isRead: 1, readAt: new Date() },
        {
          where: {
            id: messageIds,
            userId,
            isRead: 0,
            isDeleted: 0
          }
        }
      );
    } else {
      // 标记所有未读消息
      result = await Message.update(
        { isRead: 1, readAt: new Date() },
        {
          where: {
            userId,
            isRead: 0,
            isDeleted: 0
          }
        }
      );
    }

    return success(res, { count: result[0] }, `成功标记${result[0]}条消息为已读`);
  } catch (err) {
    logger.error(`批量标记已读失败: ${err.message}`);
    return error(res, '操作失败', 500);
  }
};

/**
 * 删除消息（逻辑删除）
 */
exports.deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await Message.findOne({
      where: { id, userId, isDeleted: 0 }
    });

    if (!message) {
      return error(res, '消息不存在', 404);
    }

    await message.update({ isDeleted: 1 });

    return success(res, null, '删除成功');
  } catch (err) {
    logger.error(`删除消息失败: ${err.message}`);
    return error(res, '操作失败', 500);
  }
};

/**
 * 获取未读消息数量
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    const count = await MessageService.getUnreadCount(userId);

    return success(res, { count });
  } catch (err) {
    logger.error(`获取未读消息数量失败: ${err.message}`);
    return error(res, '获取失败', 500);
  }
};

/**
 * 运营方获取消息列表
 */
exports.getOperatorMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, pageSize = 20, isRead, type } = req.query;
    const offset = (page - 1) * pageSize;

    // 获取运营方的租户ID
    const Tenant = require('./Tenant');
    const tenant = await Tenant.findOne({
      where: { userId, isDeleted: 0 }
    });

    if (!tenant) {
      return success(res, {
        list: [],
        total: 0,
        page: parseInt(page),
        pageSize: parseInt(pageSize)
      });
    }

    // 构建查询条件
    const where = {
      tenantId: tenant.id,
      isDeleted: 0
    };

    if (isRead !== undefined) {
      where.isRead = parseInt(isRead);
    }

    if (type && ['system', 'order', 'point', 'audit', 'announcement'].includes(type)) {
      where.type = type;
    }

    const { count, rows } = await Message.findAndCountAll({
      where,
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
    logger.error(`获取运营方消息列表失败: ${err.message}`);
    return error(res, '获取失败', 500);
  }
};

