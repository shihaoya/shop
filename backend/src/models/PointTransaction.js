const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const PointTransaction = sequelize.define('PointTransaction', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    comment: '流水ID'
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '用户ID'
  },
  tenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '租户ID'
  },
  transactionType: {
    type: DataTypes.ENUM('add', 'subtract', 'modify', 'exchange'),
    allowNull: false,
    comment: '交易类型：add-增加，subtract-减少，modify-修改，exchange-兑换'
  },
  pointsChange: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '积分变动数量（正数表示增加，负数表示减少）'
  },
  balanceAfter: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '变动后余额'
  },
  reason: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '变动原因'
  },
  operatorId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: '操作人ID（运营方或系统）'
  },
  operatorName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作人姓名'
  },
  relatedOrderId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: '关联订单ID（兑换时）'
  }
}, {
  tableName: 'point_transactions',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['user_id', 'tenant_id'] },
    { fields: ['created_at'] },
    { fields: ['transaction_type'] }
  ]
});

module.exports = PointTransaction;
