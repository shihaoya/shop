const { DataTypes } = require('sequelize');
const { sequelize } = require('./database');

const Upload = sequelize.define('Upload', {
  id: {
    type: DataTypes.INTEGER.UNSIGNED,
    autoIncrement: true,
    primaryKey: true,
    comment: '文件ID'
  },
  fileName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    field: 'file_name',
    comment: '文件名'
  },
  originalName: {
    type: DataTypes.STRING(255),
    allowNull: false,
    field: 'original_name',
    comment: '原始文件名'
  },
  filePath: {
    type: DataTypes.STRING(500),
    allowNull: false,
    field: 'file_path',
    comment: '文件存储路径'
  },
  fileSize: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: false,
    field: 'file_size',
    comment: '文件大小（字节）'
  },
  fileType: {
    type: DataTypes.STRING(50),
    allowNull: false,
    field: 'file_type',
    comment: '文件类型（mime type）'
  },
  module: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: '所属模块（product/tenant/user等）'
  },
  relatedId: {
    type: DataTypes.INTEGER.UNSIGNED,
    allowNull: true,
    field: 'related_id',
    comment: '关联业务ID（如product_id）'
  },
  relatedType: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'related_type',
    comment: '关联业务类型（如product/tenant）'
  },
  isDeleted: {
    type: DataTypes.TINYINT.UNSIGNED,
    defaultValue: 0,
    field: 'is_deleted',
    comment: '是否删除：0-未删除，1-已删除'
  }
}, {
  tableName: 'uploads',
  timestamps: true,
  underscored: true,
  createdAt: 'created_at',
  updatedAt: false
});

// 软删除方法
Upload.prototype.softDelete = async function() {
  return this.update({ isDeleted: 1 });
};

module.exports = Upload;

