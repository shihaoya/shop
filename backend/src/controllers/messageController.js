const { Message, User } = require('../models');
const { Op } = require('sequelize');

/**
 * 获取当前用户的消息列表
 */
exports.getMyMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      type, 
      isRead,
      priority,
      keyword 
    } = req.query;

    const where = {
      userId,
      isDeleted: 0
    };

    if (type) {
      where.type = type;
    }

    if (isRead !== undefined) {
      where.isRead = parseInt(isRead);
    }

    if (priority) {
      where.priority = priority;
    }

    if (keyword) {
      where[Op.or] = [
        { title: { [Op.like]: `%${keyword}%` } },
        { content: { [Op.like]: `%${keyword}%` } }
      ];
    }

    const offset = (page - 1) * limit;
    
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
      limit: parseInt(limit),
      offset
    });

    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        list: rows,
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    console.error('获取消息列表失败:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取未读消息数量
 */
exports.getUnreadCount = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const count = await Message.count({
      where: {
        userId,
        isRead: 0,
        isDeleted: 0
      }
    });

    return res.json({
      code: 200,
      message: '获取成功',
      data: {
        unreadCount: count
      }
    });
  } catch (error) {
    console.error('获取未读数量失败:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 标记消息为已读
 */
exports.markAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findOne({
      where: {
        id: messageId,
        userId,
        isDeleted: 0
      }
    });

    if (!message) {
      return res.status(404).json({
        code: 404,
        message: '消息不存在'
      });
    }

    if (message.isRead === 1) {
      return res.json({
        code: 200,
        message: '消息已是已读状态',
        data: message
      });
    }

    await message.update({
      isRead: 1,
      readAt: new Date()
    });

    return res.json({
      code: 200,
      message: '标记成功',
      data: message
    });
  } catch (error) {
    console.error('标记消息已读失败:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 批量标记消息为已读
 */
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { type } = req.body;

    const where = {
      userId,
      isRead: 0,
      isDeleted: 0
    };

    if (type) {
      where.type = type;
    }

    const [affectedCount] = await Message.update(
      {
        isRead: 1,
        readAt: new Date()
      },
      { where }
    );

    return res.json({
      code: 200,
      message: '标记成功',
      data: {
        affectedCount
      }
    });
  } catch (error) {
    console.error('批量标记消息已读失败:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 删除消息（软删除）
 */
exports.deleteMessage = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findOne({
      where: {
        id: messageId,
        userId,
        isDeleted: 0
      }
    });

    if (!message) {
      return res.status(404).json({
        code: 404,
        message: '消息不存在'
      });
    }

    await message.update({
      isDeleted: 1
    });

    return res.json({
      code: 200,
      message: '删除成功'
    });
  } catch (error) {
    console.error('删除消息失败:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 批量删除消息
 */
exports.batchDeleteMessages = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageIds } = req.body;

    if (!messageIds || !Array.isArray(messageIds) || messageIds.length === 0) {
      return res.status(400).json({
        code: 400,
        message: '请提供要删除的消息ID列表'
      });
    }

    const [affectedCount] = await Message.update(
      { isDeleted: 1 },
      {
        where: {
          id: { [Op.in]: messageIds },
          userId,
          isDeleted: 0
        }
      }
    );

    return res.json({
      code: 200,
      message: '删除成功',
      data: {
        affectedCount
      }
    });
  } catch (error) {
    console.error('批量删除消息失败:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 获取消息详情
 */
exports.getMessageDetail = async (req, res) => {
  try {
    const userId = req.user.id;
    const { messageId } = req.params;

    const message = await Message.findOne({
      where: {
        id: messageId,
        userId,
        isDeleted: 0
      },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'nickname']
        }
      ]
    });

    if (!message) {
      return res.status(404).json({
        code: 404,
        message: '消息不存在'
      });
    }

    // 如果未读，自动标记为已读
    if (message.isRead === 0) {
      await message.update({
        isRead: 1,
        readAt: new Date()
      });
    }

    return res.json({
      code: 200,
      message: '获取成功',
      data: message
    });
  } catch (error) {
    console.error('获取消息详情失败:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 发送系统消息（管理员使用）
 */
exports.sendSystemMessage = async (req, res) => {
  try {
    const { userId, title, content, type = 'system', priority = 'normal', expireAt } = req.body;

    if (!userId || !title || !content) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数'
      });
    }

    // 验证用户是否存在
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: '用户不存在'
      });
    }

    const message = await Message.create({
      userId,
      title,
      content,
      type,
      priority,
      senderId: req.user.id,
      senderName: req.user.nickname || req.user.username,
      expireAt: expireAt || null
    });

    return res.json({
      code: 200,
      message: '消息发送成功',
      data: message
    });
  } catch (error) {
    console.error('发送系统消息失败:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

/**
 * 广播消息（给所有用户发送）
 */
exports.broadcastMessage = async (req, res) => {
  try {
    const { title, content, type = 'announcement', priority = 'normal', expireAt } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        code: 400,
        message: '缺少必要参数'
      });
    }

    // 获取所有用户
    const users = await User.findAll({
      where: {
        status: 1,
        isDeleted: 0
      },
      attributes: ['id']
    });

    // 批量创建消息
    const messages = users.map(user => ({
      userId: user.id,
      title,
      content,
      type,
      priority,
      senderId: req.user.id,
      senderName: req.user.nickname || req.user.username,
      expireAt: expireAt || null
    }));

    await Message.bulkCreate(messages);

    return res.json({
      code: 200,
      message: `消息已发送给 ${users.length} 个用户`,
      data: {
        sentCount: users.length
      }
    });
  } catch (error) {
    console.error('广播消息失败:', error);
    return res.status(500).json({
      code: 500,
      message: '服务器内部错误'
    });
  }
};

