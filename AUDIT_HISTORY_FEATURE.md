# 租户审核历史记录功能

## 功能概述

为了实现审核操作的可追溯性，系统新增了**租户审核历史记录**功能。每次管理员对运营方申请进行审核（通过/拒绝）或修改审核状态时，都会自动创建一条审核历史记录，永久保存而不被覆盖或删除。

## 数据库设计

### 新增表：tenant_audit_history

| 字段 | 类型 | 说明 |
|------|------|------|
| id | BIGINT UNSIGNED | 审核历史ID（主键） |
| tenant_id | INT UNSIGNED | 租户ID |
| previous_status | ENUM | 审核前状态（pending/approved/rejected/disabled） |
| new_status | ENUM | 审核后状态 |
| audit_result | ENUM | 审核结果（approved-通过，rejected-拒绝） |
| reject_reason | TEXT | 拒绝原因（仅当拒绝时记录） |
| auditor_id | INT UNSIGNED | 审核人ID（管理员） |
| auditor_username | VARCHAR(50) | 审核人用户名 |
| remark | TEXT | 审核备注 |
| created_at | DATETIME | 审核时间 |
| updated_at | DATETIME | 更新时间 |

### 索引
- `tenant_id`: 快速查询某个租户的所有审核历史
- `auditor_id`: 查询某个管理员的审核记录
- `audit_result`: 按审核结果筛选
- `created_at`: 按时间排序

## 后端实现

### 1. 模型文件
- **文件**: `backend/src/models/TenantAuditHistory.js`
- **关联**: 
  - Tenant.hasMany(TenantAuditHistory)
  - TenantAuditHistory.belongsTo(User, as: 'auditor')

### 2. Service层
- **文件**: `backend/src/services/adminService.js`

#### 修改的方法：
1. **approveTenant()** - 通过审核时创建历史记录
2. **rejectTenant()** - 拒绝审核时创建历史记录
3. **updateTenantStatus()** - 手动修改审核状态时创建历史记录

#### 新增的方法：
```javascript
getTenantAuditHistory(tenantId, page, pageSize)
// 获取指定租户的审核历史列表（分页）
```

### 3. Controller层
- **文件**: `backend/src/controllers/adminController.js`

#### 新增方法：
```javascript
getTenantAuditHistory(req, res)
// GET /admin/tenants/:id/audit-history
```

### 4. 路由
- **文件**: `backend/src/routes/admin.js`

#### 新增路由：
```javascript
GET /admin/tenants/:id/audit-history
// 获取租户审核历史
```

## 前端实现

### 1. API封装
- **文件**: `frontend-pc/src/api/admin.js`

```javascript
export const getTenantAuditHistory = (id, params) => {
  return request.get(`/admin/tenants/${id}/audit-history`, { params })
}
```

### 2. 页面更新
- **文件**: `frontend-pc/src/views/Admin/TenantAudit.vue`

#### 新增功能：
1. 在操作列添加"审核历史"按钮
2. 点击按钮弹出审核历史对话框
3. 显示内容包括：
   - 审核结果（通过/拒绝标签）
   - 状态变更（待审核 → 已通过）
   - 拒绝原因
   - 审核人
   - 审核时间
4. 支持分页查看历史记录

## 使用流程

### 场景1：管理员审核运营方申请

1. 管理员进入"运营方审核"页面
2. 点击"通过"或"拒绝"按钮
3. 系统自动：
   - 更新租户状态
   - **创建审核历史记录**
   - 记录操作日志

### 场景2：管理员修改审核状态

1. 管理员进入"用户管理"页面
2. 点击运营方的"编辑"按钮
3. 修改"审核状态"（待审核/已通过/已拒绝）
4. 如果选择"已拒绝"，填写拒绝原因
5. 点击确定后，系统自动：
   - 更新租户状态
   - **创建审核历史记录**（如果状态发生变化）
   - 记录操作日志

### 场景3：查看审核历史

1. 管理员进入"运营方审核"页面
2. 点击任意租户的"审核历史"按钮
3. 弹出对话框显示该租户的所有审核记录
4. 可以看到：
   - 每次审核的结果
   - 状态是如何变化的
   - 谁审核的
   - 什么时候审核的
   - 拒绝的原因是什么

## 数据示例

### 审核历史记录示例

```json
{
  "id": 1,
  "tenantId": 5,
  "previousStatus": "pending",
  "newStatus": "rejected",
  "auditResult": "rejected",
  "rejectReason": "申请材料不完整，请补充营业执照和税务登记证",
  "auditorId": 1,
  "auditorUsername": "admin",
  "auditor": {
    "id": 1,
    "username": "admin",
    "nickname": "系统管理员"
  },
  "createdAt": "2026-04-15T10:30:00.000Z",
  "updatedAt": "2026-04-15T10:30:00.000Z"
}
```

### 多次审核的时间线

一个租户可能经历多次审核：

```
2026-04-10 09:00 - 提交申请（pending）
2026-04-10 14:30 - 管理员A拒绝（rejected）- 原因：材料不全
2026-04-11 10:00 - 运营方重新提交（pending）
2026-04-11 15:20 - 管理员B通过（approved）
```

所有记录都会保存在 `tenant_audit_history` 表中，不会被删除或覆盖。

## 优势

1. **可追溯性**: 可以查看任何租户的完整审核历程
2. **责任明确**: 记录每次审核的管理员，便于追责
3. **数据分析**: 可以统计审核通过率、平均审核时长等
4. **审计合规**: 满足企业审计要求
5. **问题排查**: 出现争议时可以查看历史记录

## 数据库迁移

运行以下命令创建新表：

```bash
cd backend
npm run db:create-audit-table
```

## 注意事项

1. 只有审核结果为"通过"或"拒绝"时才会创建历史记录
2. 如果管理员将状态从"已通过"改为"待审核"，不会创建审核历史（因为没有明确的审核结果）
3. 审核历史记录是**只读的**，不能被修改或删除
4. 历史记录与租户是一对多关系，一个租户可以有多条审核历史
