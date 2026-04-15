const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const UserTenantRelation = sequelize.define('UserTenantRelation', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    comment: '关联ID'
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'user_id',
    comment: '用户ID'
  },
  tenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'tenant_id',
    comment: '租户ID'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected'),
    allowNull: false,
    defaultValue: 'pending',
    comment: '申请状态'
  },
  pointsBalance: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    field: 'points_balance',
    comment: '在该租户下的积分余额'
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
  tableName: 'user_tenant_relations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  indexes: [
    { fields: ['user_id'] },
    { fields: ['tenant_id'] },
    { unique: true, fields: ['user_id', 'tenant_id'], name: 'uk_user_tenant' }
  ]
});

module.exports = UserTenantRelation;

