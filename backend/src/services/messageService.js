const { Message } = require('../models');

/**
 * 消息服务 - 用于发送各种类型的消息通知
 */
class MessageService {
  /**
   * 发送订单相关消息
   * @param {Object} params - 消息参数
   * @param {number} params.userId - 用户ID
   * @param {string} params.title - 消息标题
   * @param {string} params.content - 消息内容
   * @param {number} params.orderId - 订单ID
   * @param {string} params.priority - 优先级
   */
  static async sendOrderMessage({ userId, title, content, orderId, priority = 'normal' }) {
    try {
      await Message.create({
        userId,
        title,
        content,
        type: 'order',
        relatedId: orderId,
        relatedType: 'order',
        priority
      });
      console.log(`订单消息已发送给用户 ${userId}: ${title}`);
    } catch (error) {
      console.error('发送订单消息失败:', error);
    }
  }

  /**
   * 发送积分变动消息
   * @param {Object} params - 消息参数
   */
  static async sendPointMessage({ userId, title, content, transactionId, priority = 'normal' }) {
    try {
      await Message.create({
        userId,
        title,
        content,
        type: 'point',
        relatedId: transactionId,
        relatedType: 'transaction',
        priority
      });
      console.log(`积分消息已发送给用户 ${userId}: ${title}`);
    } catch (error) {
      console.error('发送积分消息失败:', error);
    }
  }

  /**
   * 发送审核结果消息
   * @param {Object} params - 消息参数
   */
  static async sendAuditMessage({ userId, title, content, tenantId, priority = 'high' }) {
    try {
      await Message.create({
        userId,
        title,
        content,
        type: 'audit',
        relatedId: tenantId,
        relatedType: 'tenant',
        priority
      });
      console.log(`审核消息已发送给用户 ${userId}: ${title}`);
    } catch (error) {
      console.error('发送审核消息失败:', error);
    }
  }

  /**
   * 发送系统公告
   * @param {Object} params - 消息参数
   */
  static async sendSystemMessage({ userId, title, content, priority = 'normal' }) {
    try {
      await Message.create({
        userId,
        title,
        content,
        type: 'system',
        priority
      });
      console.log(`系统消息已发送给用户 ${userId}: ${title}`);
    } catch (error) {
      console.error('发送系统消息失败:', error);
    }
  }

  /**
   * 订单创建成功消息
   */
  static async notifyOrderCreated(order) {
    await this.sendOrderMessage({
      userId: order.userId,
      title: '订单创建成功',
      content: `您的订单 ${order.orderNo} 已创建成功，等待处理。`,
      orderId: order.id,
      priority: 'normal'
    });
  }

  /**
   * 订单取消成功消息
   */
  static async notifyOrderCancelled(order) {
    await this.sendOrderMessage({
      userId: order.userId,
      title: '订单已取消',
      content: `您的订单 ${order.orderNo} 已取消，积分和库存已恢复。`,
      orderId: order.id,
      priority: 'normal'
    });
  }

  /**
   * 订单状态更新消息
   */
  static async notifyOrderStatusUpdated(order, oldStatus, newStatus) {
    const statusMap = {
      'pending': '待处理',
      'processing': '处理中',
      'completed': '已完成',
      'cancelled': '已取消'
    };

    await this.sendOrderMessage({
      userId: order.userId,
      title: '订单状态更新',
      content: `您的订单 ${order.orderNo} 状态已从"${statusMap[oldStatus]}"变更为"${statusMap[newStatus]}"。`,
      orderId: order.id,
      priority: newStatus === 'completed' ? 'high' : 'normal'
    });
  }

  /**
   * 积分充值成功消息
   */
  static async notifyPointsAdded(userId, points, balance, operatorName) {
    await this.sendPointMessage({
      userId,
      title: '积分充值成功',
      content: `运营方 ${operatorName} 为您充值了 ${points} 积分，当前余额：${balance} 积分。`,
      transactionId: null,
      priority: 'high'
    });
  }

  /**
   * 积分扣减消息
   */
  static async notifyPointsDeducted(userId, points, balance, reason) {
    await this.sendPointMessage({
      userId,
      title: '积分扣减通知',
      content: `您的积分被扣减 ${points} 分，原因：${reason}，当前余额：${balance} 积分。`,
      transactionId: null,
      priority: 'normal'
    });
  }

  /**
   * 租户审核通过消息
   */
  static async notifyTenantApproved(userId, tenantName) {
    await this.sendAuditMessage({
      userId,
      title: '租户申请已通过',
      content: `恭喜！您的租户申请"${tenantName}"已通过审核，现在可以开始使用系统功能了。`,
      tenantId: null,
      priority: 'high'
    });
  }

  /**
   * 租户审核拒绝消息
   */
  static async notifyTenantRejected(userId, tenantName, rejectReason) {
    await this.sendAuditMessage({
      userId,
      title: '租户申请被拒绝',
      content: `很抱歉，您的租户申请"${tenantName}"未通过审核。拒绝原因：${rejectReason}`,
      tenantId: null,
      priority: 'high'
    });
  }
}

module.exports = MessageService;
