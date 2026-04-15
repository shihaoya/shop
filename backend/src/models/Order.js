const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    comment: '订单ID'
  },
  orderNo: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '订单号'
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '用户ID'
  },
  tenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '租户ID（运营方）'
  },
  productId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '商品ID'
  },
  productName: {
    type: DataTypes.STRING(200),
    allowNull: false,
    comment: '商品名称（快照）'
  },
  pointsCost: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '消耗积分'
  },
  quantity: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    defaultValue: 1,
    comment: '兑换数量'
  },
  totalPoints: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: '总消耗积分'
  },
  status: {
    type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
    allowNull: false,
    defaultValue: 'pending',
    comment: '订单状态：pending-待处理，completed-已完成，cancelled-已取消'
  },
  recipientName: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '收货人姓名'
  },
  recipientPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    comment: '收货人电话'
  },
  recipientAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '收货地址'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '备注'
  },
  isDeleted: {
    type: DataTypes.TINYINT.UNSIGNED,
    allowNull: false,
    defaultValue: 0,
    comment: '是否删除：0-未删除，1-已删除'
  }
}, {
  tableName: 'orders',
  timestamps: true,
  underscored: true,
  indexes: [
    {
      fields: ['order_no']
    },
    {
      fields: ['user_id']
    },
    {
      fields: ['tenant_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['is_deleted']
    }
  ]
});

module.exports = Order;

