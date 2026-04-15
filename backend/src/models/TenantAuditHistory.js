const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

/**
 * 租户审核历史表
 * 记录每次审核操作的完整信息
 */
const TenantAuditHistory = sequelize.define('TenantAuditHistory', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    comment: '审核历史ID'
  },
  tenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '租户ID'
  },
  previousStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'disabled'),
    allowNull: true,
    comment: '审核前状态'
  },
  newStatus: {
    type: DataTypes.ENUM('pending', 'approved', 'rejected', 'disabled'),
    allowNull: false,
    comment: '审核后状态'
  },
  auditResult: {
    type: DataTypes.ENUM('approved', 'rejected'),
    allowNull: false,
    comment: '审核结果：approved-通过，rejected-拒绝'
  },
  rejectReason: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '拒绝原因（如果拒绝）'
  },
  auditorId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '审核人ID（管理员）'
  },
  auditorUsername: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '审核人用户名'
  },
  remark: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '审核备注'
  }
}, {
  tableName: 'tenant_audit_history',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['auditor_id'] },
    { fields: ['audit_result'] },
    { fields: ['created_at'] }
  ]
});

module.exports = TenantAuditHistory;
