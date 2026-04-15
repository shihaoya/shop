const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

/**
 * 消息通知表
 */
const Message = sequelize.define('Message', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    comment: '消息ID'
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '接收用户ID'
  },
  tenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: '关联租户ID（可选）'
  },
  title: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '消息标题'
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '消息内容'
  },
  type: {
    type: DataTypes.ENUM('system', 'order', 'point', 'audit', 'announcement'),
    allowNull: false,
    defaultValue: 'system',
    comment: '消息类型：system-系统消息，order-订单消息，point-积分消息，audit-审核消息，announcement-公告'
  },
  relatedId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: '关联业务ID（如订单ID、流水ID等）'
  },
  relatedType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '关联业务类型（如order、transaction等）'
  },
  isRead: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '是否已读：0-未读，1-已读'
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '阅读时间'
  },
  senderId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: '发送者ID（系统消息为null）'
  },
  senderName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '发送者名称'
  },
  priority: {
    type: DataTypes.ENUM('low', 'normal', 'high', 'urgent'),
    allowNull: false,
    defaultValue: 'normal',
    comment: '优先级：low-低，normal-普通，high-高，urgent-紧急'
  },
  expireAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '过期时间（null表示不过期）'
  },
  isDeleted: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '是否删除：0-未删除，1-已删除'
  }
}, {
  tableName: 'messages',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['tenant_id'] },
    { fields: ['type'] },
    { fields: ['is_read'] },
    { fields: ['created_at'] },
    { fields: ['priority'] }
  ]
});

module.exports = Message;

