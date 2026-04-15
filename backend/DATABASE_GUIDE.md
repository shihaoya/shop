# 数据库结构管理指南

## 📋 概述

本项目的数据库结构采用**单一数据源**原则：
- **权威定义**: `backend/database/init.sql` - 包含所有表的完整SQL定义
- **模型定义**: `backend/src/models/*.js` - Sequelize ORM模型（与init.sql保持一致）
- **同步工具**: `npm run db:sync` - 自动检查并同步数据库结构

## 🗂️ 数据库表清单

| 序号 | 表名 | 说明 | 对应模型 |
|------|------|------|----------|
| 1 | users | 用户表 | User.js |
| 2 | tenants | 租户表 | Tenant.js |
| 3 | user_tenant_relations | 用户-租户关联表 | UserTenantRelation.js |
| 4 | products | 商品表 | Product.js |
| 5 | point_transactions | 积分流水表 | PointTransaction.js |
| 6 | operation_logs | 操作日志表 | OperationLog.js |
| 7 | tenant_audit_history | 租户审核历史表 | TenantAuditHistory.js |

## 🔄 开发流程

### 场景1：新增表或修改表结构

**步骤：**

1. **修改 init.sql**
   ```sql
   -- 在 backend/database/init.sql 中添加或修改表定义
   CREATE TABLE IF NOT EXISTS `new_table` (
     ...
   );
   ```

2. **创建/修改对应的Sequelize模型**
   ```javascript
   // 在 backend/src/models/NewTable.js 中定义模型
   const NewTable = sequelize.define('NewTable', {
     // 字段定义
   }, {
     tableName: 'new_table',
     timestamps: true,
     underscored: true
   });
   ```

3. **注册模型和关联关系**
   ```javascript
   // 在 backend/src/models/index.js 中
   const NewTable = require('./NewTable');
   
   // 定义关联关系
   // ...
   
   module.exports = {
     // ...其他模型
     NewTable
   };
   ```

4. **同步数据库**
   ```bash
   cd backend
   npm run db:sync
   ```

5. **验证**
   - 检查控制台输出，确认表已创建/更新
   - 登录MySQL查看表结构是否正确

### 场景2：初始化全新数据库

```bash
# 方法1：使用init.sql（推荐用于生产环境）
mysql -u root -p < backend/database/init.sql

# 方法2：使用Sequelize同步（推荐用于开发环境）
cd backend
npm run db:sync
npm run init:admin  # 创建管理员账号
```

### 场景3：检查数据库结构是否一致

```bash
# 运行同步脚本，它会自动检查并报告差异
cd backend
npm run db:sync
```

如果输出显示所有表都已存在且无错误，说明数据库结构与模型定义一致。

## ⚠️ 注意事项

### 1. 不要直接修改生产数据库
- 所有结构变更必须先修改 `init.sql`
- 然后在开发环境测试
- 最后通过迁移脚本应用到生产环境

### 2. 避免频繁创建临时脚本
- ❌ **错误做法**: 每次改表结构都创建新的脚本文件
- ✅ **正确做法**: 直接修改 `init.sql`，使用统一的 `db:sync` 脚本

### 3. 外键约束
- init.sql 中定义了外键约束
- Sequelize模型中也定义了关联关系
- 两者必须保持一致

### 4. 索引命名
- 唯一索引使用 `uk_` 前缀（如 `uk_user_tenant`）
- 普通索引使用 `idx_` 前缀（如 `idx_username`）
- 保持命名规范一致

### 5. 字符集和排序规则
- 统一使用 `utf8mb4` 字符集
- 统一使用 `utf8mb4_unicode_ci` 排序规则

## 🔍 常见问题

### Q1: 运行 db:sync 后表没有变化？

**A:** `db:sync({ alter: false })` 只会创建不存在的表，不会修改现有表结构。如果需要修改现有表：

```bash
# 方法1：删除表后重新同步（会丢失数据！）
mysql -u root -p -e "DROP DATABASE point_exchange_system;"
npm run db:sync

# 方法2：手动执行ALTER TABLE语句
mysql -u root -p point_exchange_system
ALTER TABLE users ADD COLUMN new_field VARCHAR(100);
```

### Q2: init.sql 和模型定义不一致怎么办？

**A:** 
1. 以 `init.sql` 为准（它是权威定义）
2. 修改对应的模型文件使其与init.sql一致
3. 运行 `npm run db:sync` 验证

### Q3: 如何查看当前数据库有哪些表？

```bash
mysql -u root -p point_exchange_system -e "SHOW TABLES;"
```

### Q4: 如何查看某个表的结构？

```bash
mysql -u root -p point_exchange_system -e "DESCRIBE users;"
```

### Q5: 开发过程中频繁修改表结构怎么办？

**A:** 推荐使用以下流程：

```bash
# 1. 修改 init.sql 和模型文件
# 2. 删除测试数据库
mysql -u root -p -e "DROP DATABASE IF EXISTS point_exchange_system;"

# 3. 重新初始化
npm run db:sync
npm run init:admin

# 4. 启动服务测试
npm run dev
```

## 📝 最佳实践

1. **版本控制**: init.sql 应该纳入Git版本控制
2. **变更记录**: 重大结构变更应在commit message中说明
3. **备份数据**: 修改生产数据库前先备份
4. **测试先行**: 先在开发环境测试，确认无误后再应用到生产环境
5. **文档同步**: 修改表结构后，及时更新相关文档

## 🛠️ 常用命令

```bash
# 同步数据库结构
npm run db:sync

# 初始化管理员账号
npm run init:admin

# 创建测试数据库
npm run db:test:create

# 查看数据库中的所有表
mysql -u root -p point_exchange_system -e "SHOW TABLES;"

# 导出数据库结构（不含数据）
mysqldump -u root -p --no-data point_exchange_system > backup_structure.sql

# 导入数据库
mysql -u root -p point_exchange_system < backend/database/init.sql
```

## 📊 数据库ER图

```
users (用户表)
  ├── tenants (租户表) [1:1]
  ├── user_tenant_relations (用户-租户关联) [1:N]
  ├── point_transactions (积分流水) [1:N]
  └── tenant_audit_history (审核历史) [1:N, 作为审核人]

tenants (租户表)
  ├── user_tenant_relations [1:N]
  ├── products (商品表) [1:N]
  ├── point_transactions [1:N]
  └── tenant_audit_history [1:N]

products (商品表)
  └── [独立表，通过tenant_id关联]

point_transactions (积分流水表)
  └── [记录表，通过user_id和tenant_id关联]

operation_logs (操作日志表)
  └── [独立日志表，通过user_id关联操作用户]

tenant_audit_history (租户审核历史表)
  └── [记录表，记录租户的审核历程]
```

---

**最后更新**: 2026-04-15  
**维护者**: 开发团队
