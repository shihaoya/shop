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
    field: 'user_id',
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
    field: 'operation_type',
    comment: '操作类型'
  },
  operationModule: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'operation_module',
    comment: '操作模块'
  },
  operationDesc: {
    type: DataTypes.TEXT,
    allowNull: false,
    field: 'operation_desc',
    comment: '操作描述'
  },
  requestMethod: {
    type: DataTypes.STRING(10),
    allowNull: true,
    field: 'request_method',
    comment: '请求方法'
  },
  requestUrl: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'request_url',
    comment: '请求URL'
  },
  requestParams: {
    type: DataTypes.TEXT,
    allowNull: true,
    field: 'request_params',
    comment: '请求参数（JSON）'
  },
  responseCode: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'response_code',
    comment: '响应码'
  },
  ipAddress: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'ip_address',
    comment: 'IP地址'
  },
  userAgent: {
    type: DataTypes.STRING(255),
    allowNull: true,
    field: 'user_agent',
    comment: '用户代理'
  }
}, {
  tableName: 'operation_logs',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    { fields: ['user_id'] },
    { fields: ['operation_type'] },
    { fields: ['created_at'] }
  ]
});

module.exports = OperationLog;
