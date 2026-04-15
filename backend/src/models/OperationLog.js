const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const OperationLog = sequelize.define('OperationLog', {
  id: {
    type: DataTypes.BIGINT.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    comment: '日志ID'
  },
  userId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    comment: '操作用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '操作用户名'
  },
  operationType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作类型'
  },
  operationModule: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '操作模块'
  },
  operationDesc: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: '操作描述'
  },
  requestMethod: {
    type: DataTypes.STRING(10),
    allowNull: true,
    comment: '请求方法'
  },
  requestUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '请求URL'
  },
  requestParams: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '请求参数（JSON）'
  },
  responseCode: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: '响应码'
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: 'IP地址'
  },
  userAgent: {
    type: DataTypes.STRING(255),
    allowNull: true,
    comment: '用户代理'
  }
}, {
  tableName: 'operation_logs',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['operation_type'] },
    { fields: ['created_at'] }
  ]
});

module.exports = OperationLog;
