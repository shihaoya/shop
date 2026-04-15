# 功能更新说明

## 更新时间
2026-04-15

## 新增功能

### 1. 运营方审核状态管理

#### 后端接口
- **GET** `/api/v1/tenants/my-status`
  - 获取运营方自己的租户审核状态
  - 需要operator角色认证
  - 返回租户详细信息（包括状态、拒绝原因等）

- **PUT** `/api/v1/tenants/resubmit`
  - 运营方重新提交审核申请
  - 需要operator角色认证
  - 只有被拒绝的状态才能重新提交
  - 请求体：
    ```json
    {
      "name": "新的租户名称",
      "description": "新的申请描述"
    }
    ```

#### 前端页面
- **路径**: `/operator/audit-status`
- **组件**: `src/views/Operator/AuditStatus.vue`
- **功能**:
  - 显示当前审核状态（待审核/已通过/已拒绝/已禁用）
  - 被拒绝时显示管理员的拒绝原因
  - 被拒绝时提供"重新提交审核"按钮
  - 重新提交时弹出对话框填写租户名称和申请描述

#### 菜单入口
- 运营方侧边栏新增"审核状态"菜单项（第一个菜单）

---

### 2. 修改密码功能

#### 后端接口
- **POST** `/api/v1/auth/change-password`
  - 修改用户密码
  - 需要所有角色认证（admin/operator/user）
  - 请求体：
    ```json
    {
      "oldPassword": "旧密码",
      "newPassword": "新密码"
    }
    ```
  - 密码验证规则：
    - 长度至少8位
    - 必须包含字母和数字
  - 验证旧密码是否正确

#### 前端组件
- **组件**: `src/components/Common/ChangePassword.vue`
- **功能**:
  - 对话框形式的密码修改界面
  - 表单验证：
    - 旧密码必填
    - 新密码长度至少8位
    - 新密码必须包含字母和数字
    - 确认新密码必须与新密码一致
  - 修改成功后显示提示，3秒后自动退出登录
  - 密码修改成功后需要重新登录

#### 菜单入口
- 所有角色在顶部导航栏的用户下拉菜单中新增"修改密码"选项
- 修改密码成功后的处理流程：
  1. 显示成功提示
  2. 3秒后自动退出登录
  3. 跳转到登录页面

---

## 文件变更清单

### 后端文件
1. `src/controllers/tenantController.js` - 新增两个方法
   - `getMyTenantStatus()` - 获取审核状态
   - `resubmitAudit()` - 重新提交审核

2. `src/routes/tenants.js` - 新增路由
   - `GET /my-status`
   - `PUT /resubmit`

3. `src/controllers/authController.js` - 新增修改密码
   - `changePassword()` - 修改密码控制器

4. `src/services/authService.js` - 新增业务逻辑
   - `changePassword()` - 修改密码业务逻辑

5. `src/routes/auth.js` - 新增路由
   - `POST /change-password`

### 前端文件
1. `src/views/Operator/AuditStatus.vue` - **新建**
   - 运营方审核状态页面

2. `src/components/Common/ChangePassword.vue` - **新建**
   - 修改密码通用组件

3. `src/api/index.js` - 新增API函数
   - `getMyTenantStatus()`
   - `resubmitAudit()`
   - `changePassword()`

4. `src/router/index.js` - 新增路由
   - `/operator/audit-status`

5. `src/components/Layout/index.vue` - 更新
   - 运营方菜单新增"审核状态"
   - 用户下拉菜单新增"修改密码"
   - 集成修改密码组件

---

## 使用流程

### 运营方审核流程
1. 运营方注册时自动创建租户，状态为`pending`（待审核）
2. 管理员审核运营方申请
3. 如果被拒绝，运营方可以在"审核状态"页面：
   - 查看拒绝原因
   - 点击"重新提交审核"
   - 填写新的租户名称和申请描述
   - 提交后状态变更为`pending`，等待管理员再次审核
4. 审核通过后，运营方可以使用完整功能

### 修改密码流程
1. 任意角色用户点击右上角用户名
2. 选择"修改密码"
3. 填写旧密码和新密码
4. 验证成功后密码立即更新
5. 系统提示3秒后自动退出
6. 使用新密码重新登录

---

## 技术细节

### 数据库字段
- `tenants` 表已支持 `status` 和 `reject_reason` 字段
- status枚举值：`pending`, `approved`, `rejected`, `disabled`
- reject_reason：存储管理员拒绝的原因

### 安全考虑
- 密码修改需要验证旧密码
- 新密码强制复杂度要求（长度+字符类型）
- 密码使用bcrypt加密存储
- 修改密码后强制重新登录（防止会话劫持）

### 错误处理
- 所有接口都有完整的错误处理
- 前端使用ElMessage显示错误信息
- 后端使用logger记录错误日志
- 参数验证使用统一的error响应格式

---

## 测试建议

### 测试运营方审核功能
1. 注册新的运营方账号
2. 登录运营方，查看审核状态（应为"待审核"）
3. 使用管理员账号拒绝该运营方
4. 运营方登录查看拒绝原因
5. 运营方重新提交审核
6. 管理员再次审核通过

### 测试修改密码功能
1. 使用任意角色登录
2. 点击修改密码
3. 测试错误情况：
   - 旧密码错误
   - 新密码长度不足8位
   - 新密码不包含字母/数字
   - 两次新密码不一致
4. 测试成功情况：
   - 输入正确的旧密码
   - 输入符合要求的新密码
   - 确认密码修改成功
   - 验证是否自动退出登录
   - 使用新密码重新登录
