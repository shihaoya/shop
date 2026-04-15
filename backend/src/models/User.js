const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    comment: '用户ID'
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    comment: '用户名'
  },
  password: {
    type: DataTypes.STRING(255),
    allowNull: false,
    comment: '密码（bcrypt加密）'
  },
  nickname: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '昵称'
  },
  role: {
    type: DataTypes.ENUM('admin', 'operator', 'user'),
    allowNull: false,
    defaultValue: 'user',
    comment: '角色'
  },
  status: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 1,
    comment: '状态：0-禁用，1-启用'
  },
  isDeleted: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '逻辑删除：0-未删除，1-已删除'
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '删除时间'
  },
  lastLoginAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '最后登录时间'
  },
  loginFailCount: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '登录失败次数'
  },
  lockedUntil: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '锁定到期时间'
  }
}, {
  tableName: 'users',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['username'] },
    { fields: ['role'] },
    { fields: ['status'] }
  ]
});

module.exports = User;

