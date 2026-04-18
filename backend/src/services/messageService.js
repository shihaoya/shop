const { Message, User, Tenant } = require('../models');
const { logger } = require('../middlewares/logger');

/**
 * 消息服务类
 */
class MessageService {
  /**
   * 发送消息
   * @param {Object} params - 消息参数
   * @param {number} params.userId - 接收用户ID
   * @param {string} params.title - 消息标题
   * @param {string} params.content - 消息内容
   * @param {string} params.type - 消息类型：system/order/point/audit/announcement
   * @param {number} [params.tenantId] - 关联租户ID
   * @param {number} [params.relatedId] - 关联业务ID
   * @param {string} [params.relatedType] - 关联业务类型
   * @param {number} [params.senderId] - 发送者ID
   * @param {string} [params.senderName] - 发送者名称
   * @param {string} [params.priority] - 优先级：low/normal/high/urgent
   */
  static async sendMessage({
    userId,
    title,
    content,
    type = 'system',
    tenantId = null,
    relatedId = null,
    relatedType = null,
    senderId = null,
    senderName = null,
    priority = 'normal'
  }) {
    try {
      const message = await Message.create({
        userId,
        tenantId,
        title,
        content,
        type,
        relatedId,
        relatedType,
        senderId,
        senderName,
        priority
      });

      logger.info(`消息发送成功: 用户${userId}, 类型${type}, 标题${title}`);
      return message;
    } catch (error) {
      logger.error(`消息发送失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 批量发送消息
   * @param {Array} userIds - 用户ID数组
   * @param {Object} messageData - 消息数据（同sendMessage）
   */
  static async sendBatchMessage(userIds, messageData) {
    try {
      const promises = userIds.map(userId => 
        this.sendMessage({ ...messageData, userId })
      );
      
      const results = await Promise.allSettled(promises);
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.filter(r => r.status === 'rejected').length;

      logger.info(`批量消息发送完成: 成功${successCount}, 失败${failCount}`);
      return { successCount, failCount };
    } catch (error) {
      logger.error(`批量消息发送失败: ${error.message}`);
      throw error;
    }
  }

  /**
   * 通知运营方有新用户申请
   */
  static async notifyOperatorNewApplication(tenantId, username) {
    try {
      // 获取租户对应的运营方用户ID
      const tenant = await Tenant.findByPk(tenantId);
      if (!tenant) return;

      await this.sendMessage({
        userId: tenant.userId,
        title: '新用户申请加入',
        content: `用户【${username}】申请加入您的运营方，请及时审核。`,
        type: 'audit',
        tenantId,
        relatedId: tenantId,
        relatedType: 'tenant_application',
        priority: 'high'
      });
    } catch (error) {
      logger.error(`通知运营方新申请失败: ${error.message}`);
    }
  }

  /**
   * 通知用户申请审核结果
   */
  static async notifyUserApplicationResult(userId, tenantName, approved, rejectReason = '') {
    try {
      const title = approved ? '申请已通过' : '申请已被拒绝';
      const content = approved 
        ? `您申请加入【${tenantName}】的请求已通过，现在可以浏览和兑换商品了。`
        : `您申请加入【${tenantName}】的请求被拒绝。原因：${rejectReason || '未说明'}`;

      await this.sendMessage({
        userId,
        title,
        content,
        type: 'audit',
        priority: approved ? 'normal' : 'high'
      });
    } catch (error) {
      logger.error(`通知用户申请结果失败: ${error.message}`);
    }
  }

  /**
   * 通知运营方有新订单
   */
  static async notifyOperatorNewOrder(order) {
    try {
      const user = await User.findByPk(order.userId);
      const username = user?.nickname || user?.username || '未知用户';

      // 获取租户对应的运营方用户ID
      const Tenant = require('../models/Tenant');
      const tenant = await Tenant.findByPk(order.tenantId);
      if (!tenant) return;

      await this.sendMessage({
        userId: tenant.userId,
        title: '收到新订单',
        content: `用户【${username}】兑换了商品【${order.productName}】，消耗${order.totalPoints}积分。`,
        type: 'order',
        tenantId: order.tenantId,
        relatedId: order.id,
        relatedType: 'order',
        priority: 'high'
      });
    } catch (error) {
      logger.error(`通知运营方新订单失败: ${error.message}`);
    }
  }

  /**
   * 通知订单创建（别名方法）
   */
  static async notifyOrderCreated(order) {
    return this.notifyOperatorNewOrder(order);
  }

  /**
   * 通知用户订单状态变更
   */
  static async notifyUserOrderStatusChange(order, oldStatus, newStatus) {
    try {
      const statusMap = {
        pending: '待处理',
        processing: '处理中',
        completed: '已完成',
        cancelled: '已取消'
      };

      await this.sendMessage({
        userId: order.userId,
        title: '订单状态已更新',
        content: `您的订单【${order.orderNo}】状态已从【${statusMap[oldStatus]}】更新为【${statusMap[newStatus]}】。`,
        type: 'order',
        tenantId: order.tenantId,
        relatedId: order.id,
        relatedType: 'order'
      });
    } catch (error) {
      logger.error(`通知用户订单状态变更失败: ${error.message}`);
    }
  }

  /**
   * 通知用户订单取消
   */
  static async notifyOrderCancelled(order) {
    try {
      await this.sendMessage({
        userId: order.userId,
        title: '订单已取消',
        content: `您的订单【${order.orderNo}】已取消，积分${order.totalPoints}分已退回。`,
        type: 'order',
        tenantId: order.tenantId,
        relatedId: order.id,
        relatedType: 'order'
      });
    } catch (error) {
      logger.error(`通知订单取消失败: ${error.message}`);
    }
  }

  /**
   * 通知用户积分变动
   */
  static async notifyPointsAdded(userId, points, balanceAfter, operatorName) {
    try {
      await this.sendMessage({
        userId,
        title: '积分充值通知',
        content: `您的积分增加了${points}分，当前余额${balanceAfter}分。操作人：${operatorName}`,
        type: 'point',
        relatedId: null,
        relatedType: 'point_transaction',
        priority: 'normal'
      });
    } catch (error) {
      logger.error(`通知积分充值失败: ${error.message}`);
    }
  }

  /**
   * 通知用户积分扣减
   */
  static async notifyPointsSubtracted(userId, points, balanceAfter, reason) {
    try {
      await this.sendMessage({
        userId,
        title: '积分扣减通知',
        content: `您的积分减少了${points}分，当前余额${balanceAfter}分。原因：${reason}`,
        type: 'point',
        relatedId: null,
        relatedType: 'point_transaction',
        priority: 'normal'
      });
    } catch (error) {
      logger.error(`通知积分扣减失败: ${error.message}`);
    }
  }

  /**
   * 通知租户审核通过（管理员审核运营方）
   */
  static async notifyTenantApproved(userId, tenantName) {
    try {
      await this.sendMessage({
        userId,
        title: '审核通过通知',
        content: `恭喜！您的运营方【${tenantName}】已通过平台审核，现在可以开始管理商品和用户了。`,
        type: 'audit',
        priority: 'high'
      });
    } catch (error) {
      logger.error(`通知租户审核通过失败: ${error.message}`);
    }
  }

  /**
   * 获取用户未读消息数量
   */
  static async getUnreadCount(userId) {
    try {
      const count = await Message.count({
        where: {
          userId,
          isRead: 0,
          isDeleted: 0
        }
      });
      return count;
    } catch (error) {
      logger.error(`获取未读消息数量失败: ${error.message}`);
      return 0;
    }
  }
}

module.exports = MessageService;

