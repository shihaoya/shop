const User = require('./User');
const Tenant = require('./Tenant');
const UserTenantRelation = require('./UserTenantRelation');
const OperationLog = require('./OperationLog');

// 定义关联关系
User.hasOne(Tenant, { foreignKey: 'userId', as: 'tenant' });
Tenant.belongsTo(User, { foreignKey: 'userId', as: 'user' });

User.hasMany(UserTenantRelation, { foreignKey: 'userId', as: 'tenantRelations' });
UserTenantRelation.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Tenant.hasMany(UserTenantRelation, { foreignKey: 'tenantId', as: 'userRelations' });
UserTenantRelation.belongsTo(Tenant, { foreignKey: 'tenantId', as: 'tenant' });

module.exports = {
  User,
  Tenant,
  UserTenantRelation,
  OperationLog
};
