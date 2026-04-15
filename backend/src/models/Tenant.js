const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Tenant = sequelize.define('Tenant', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    comment: '租户ID'
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'user_id',
    comment: '关联的用户ID（运营方）'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '租户名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '申请描述'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'disabled'),
    allowNull: false,
    defaultValue: 'pending',
    comment: '状态'
  },
  rejectReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'reject_reason',
    comment: '拒绝原因'
  },
  isDeleted: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    field: 'is_deleted',
    comment: '逻辑删除'
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'deleted_at',
    comment: '删除时间'
  }
}, {
  tableName: 'tenants',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['status'] }
  ]
});

module.exports = Tenant;

