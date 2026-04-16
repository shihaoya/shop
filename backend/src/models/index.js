const { sequelize } = require('./database');
const User = require('./User');
const Tenant = require('./Tenant');
const UserTenantRelation = require('./UserTenantRelation');
const OperationLog = require('./OperationLog');
const Product = require('./Product');
const PointTransaction = require('./PointTransaction');
const TenantAuditHistory = require('./TenantAuditHistory');
const Order = require('./Order');
const Message = require('./Message');
const Upload = require('./Upload');

// 定义关联关系（使用逻辑外键，禁用物理外键约束）
User.hasOne(Tenant, { foreignKey: 'userId', as: 'tenant', constraints: false });
Tenant.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });

User.hasMany(UserTenantRelation, { foreignKey: 'userId', as: 'tenantRelations', constraints: false });
UserTenantRelation.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });

Tenant.hasMany(UserTenantRelation, { foreignKey: 'tenantId', as: 'userRelations', constraints: false });
UserTenantRelation.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant', constraints: false });

// 商品关联
Tenant.hasMany(Product, { foreignKey: 'tenantId', as: 'products', constraints: false });
Product.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant', constraints: false });

// 商品图片关联
Product.belongsTo(Upload, { foreignKey: 'image_file_id', as: 'imageFile', constraints: false });
Upload.hasMany(Product, { foreignKey: 'image_file_id', as: 'products', constraints: false });

// 积分流水关联
User.hasMany(PointTransaction, { foreignKey: 'userId', as: 'pointTransactions', constraints: false });
PointTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });

Tenant.hasMany(PointTransaction, { foreignKey: 'tenantId', as: 'pointTransactions', constraints: false });
PointTransaction.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant', constraints: false });

// 租户审核历史关联
Tenant.hasMany(TenantAuditHistory, { foreignKey: 'tenantId', as: 'auditHistory', constraints: false });
TenantAuditHistory.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant', constraints: false });
TenantAuditHistory.belongsTo(User, { foreignKey: 'auditorId', as: 'auditor', constraints: false });

// 订单关联
User.hasMany(Order, { foreignKey: 'userId', as: 'orders', constraints: false });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });
  
Tenant.hasMany(Order, { foreignKey: 'tenantId', as: 'orders', constraints: false });
Order.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant', constraints: false });
  
Product.hasMany(Order, { foreignKey: 'productId', as: 'orders', constraints: false });
Order.belongsTo(Product, { foreignKey: 'productId', as: 'product', constraints: false });
  
// 消息关联
User.hasMany(Message, { foreignKey: 'userId', as: 'messages', constraints: false });
Message.belongsTo(User, { foreignKey: 'userId', as: 'user', constraints: false });
  
Tenant.hasMany(Message, { foreignKey: 'tenantId', as: 'messages', constraints: false });
Message.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant', constraints: false });

module.exports = {
  sequelize,
  User,
  Tenant,
  UserTenantRelation,
  OperationLog,
  Product,
  PointTransaction,
  TenantAuditHistory,
  Order,
  Message,
  Upload
};
