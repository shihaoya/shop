const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    comment: '商品ID'
  },
  tenantId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    comment: '所属租户ID'
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: '商品名称'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: '商品描述'
  },
  imageUrl: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'image_file_id',
    comment: '商品图片文件ID（关联uploads表）'
  },
  pointsRequired: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '所需积分'
  },
  stock: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '库存数量'
  },
  category: {
    type: DataTypes.STRING(50),
    allowNull: true,
    comment: '商品分类'
  },
  status: {
    type: DataTypes.ENUM('on_shelf', 'off_shelf'),
    allowNull: false,
    defaultValue: 'off_shelf',
    comment: '状态：on_shelf-上架，off_shelf-下架'
  },
  sortOrder: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: '排序权重'
  },
  isDeleted: {
    type: DataTypes.TINYINT,
    allowNull: false,
    defaultValue: 0,
    comment: '逻辑删除'
  },
  deletedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: '删除时间'
  }
}, {
  tableName: 'products',
  timestamps: true,
  underscored: true,
  indexes: [
    { fields: ['tenant_id'] },
    { fields: ['status'] },
    { fields: ['category'] }
  ]
});

module.exports = Product;

