const { sequelize } = require('./database');
const User = require('./User');
const Tenant = require('./Tenant');
const UserTenantRelation = require('./UserTenantRelation');
const OperationLog = require('./OperationLog');
const Product = require('./Product');
const PointTransaction = require('./PointTransaction');
const TenantAuditHistory = require('./TenantAuditHistory');
const Order = require('./Order');

// 定义关联关系
User.hasOne(Tenant, { foreignKey: 'userId', as: 'tenant' });
Tenant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserTenantRelation, { foreignKey: 'userId', as: 'tenantRelations' });
UserTenantRelation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Tenant.hasMany(UserTenantRelation, { foreignKey: 'tenantId', as: 'userRelations' });
UserTenantRelation.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// 商品关联
Tenant.hasMany(Product, { foreignKey: 'tenantId', as: 'products' });
Product.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// 积分流水关联
User.hasMany(PointTransaction, { foreignKey: 'userId', as: 'pointTransactions' });
PointTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Tenant.hasMany(PointTransaction, { foreignKey: 'tenantId', as: 'pointTransactions' });
PointTransaction.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

// 租户审核历史关联
Tenant.hasMany(TenantAuditHistory, { foreignKey: 'tenantId', as: 'auditHistory' });
TenantAuditHistory.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });
TenantAuditHistory.belongsTo(User, { foreignKey: 'auditorId', as: 'auditor' });

// 订单关联
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Tenant.hasMany(Order, { foreignKey: 'tenantId', as: 'orders' });
Order.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

Product.hasMany(Order, { foreignKey: 'productId', as: 'orders' });
Order.belongsTo(Product, { foreignKey: 'productId', as: 'product' });

module.exports = {
  sequelize,
  User,
  Tenant,
  UserTenantRelation,
  OperationLog,
  Product,
  PointTransaction,
  TenantAuditHistory,
  Order
};
