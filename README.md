# 多租户积分兑换系统

一个基于 Node.js + Vue.js + MySQL 的多租户积分兑换管理系统。

## 📖 项目简介

本系统为运营方（商家或个人）提供积分兑换礼品活动的管理工具，支持多租户架构，每个运营方独立管理自己的商品、用户和积分体系。

**核心功能**：
- ✅ 多租户管理（运营方注册、审核）
- ✅ 商品管理（上架、下架、编辑）
- ✅ 用户管理（申请、审核、积分管理）
- ✅ 订单管理（下单、查询、导出）
- ✅ 消息通知（实时角标、8种场景）
- ✅ 操作日志（审计追踪）

---

## 🚀 快速开始

### 前置条件
- Node.js 18+
- MySQL 8.0+
- npm 或 yarn

### 1. 克隆项目
```bash
git clone <repository-url>
cd test-shop
```

### 2. 后端启动
```bash
cd backend
npm install

# 配置环境变量（复制 .env.example 到 .env 并修改配置）
cp .env.example .env

# 初始化数据库
mysql -u root -p < database/init.sql

# 初始化管理员账号（推荐）
node scripts/init-admin.js

# 如果脚本失败，可以手动创建管理员：
# 1. 生成密码哈希
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('Admin@123456',10).then(h=>console.log(h));"
# 2. 将输出的哈希值替换到下面的SQL中
mysql -u root -p -e "INSERT INTO users (username, password, nickname, role, status) VALUES ('admin', '生成的哈希值', '系统管理员', 'admin', 1);"

# 启动服务
npm run dev
```

后端服务：**http://localhost:8367**

### 3. 前端启动
```bash
cd frontend-pc
npm install
npm run dev
```

前端服务：**http://localhost:8366**

### 4. 运行测试
```bash
cd backend

# 创建测试数据库（首次运行）
mysql -u root -p -e "CREATE DATABASE point_exchange_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 运行测试
npm test
```

---

## 👤 默认账号

| 角色 | 用户名 | 密码 |
|------|--------|------|
| 管理员 | admin | Admin@123456 |
| 运营方 | operator | Operator@123456 |
| 普通用户 | user | User@123456 |

⚠️ **首次使用前请修改默认密码！**

---

## 📁 项目结构

```
test-shop/
├── backend/              # 后端项目
│   ├── src/
│   │   ├── config/      # 配置文件
│   │   ├── models/      # 数据模型
│   │   ├── controllers/ # 控制器
│   │   ├── services/    # 业务逻辑
│   │   ├── middlewares/ # 中间件
│   │   ├── routes/      # 路由
│   │   └── utils/       # 工具函数
│   ├── database/        # 数据库脚本
│   ├── tests/           # 单元测试
│   └── scripts/         # 辅助脚本
├── frontend-pc/         # PC端前端
│   ├── src/
│   │   ├── views/       # 页面组件
│   │   ├── components/  # 公共组件
│   │   ├── store/       # Pinia状态管理
│   │   ├── router/      # 路由配置
│   │   └── api/         # API接口
└── 需求/                # 项目文档
    ├── README.md                    # 本文档
    ├── 积分兑换系统需求规格说明书.md  # 需求定义
    ├── 操作流程文档.md              # 操作说明
    ├── 开发进度跟踪.md              # 整体进度
    └── 开发文档-*.md               # 各阶段技术实现
```

---

## 📝 文档导航

### 入门文档
- **[需求规格说明书](需求/积分兑换系统需求规格说明书.md)** - 完整的需求定义
- **[操作流程文档](需求/操作流程文档.md)** - 系统操作流程说明
- **[开发进度跟踪](需求/开发进度跟踪.md)** - 项目整体进度

### 技术开发文档
- **[第一阶段：基础框架](需求/开发文档-第一阶段-基础框架.md)** - 后端基础、认证授权
- **[第二阶段：核心业务](需求/开发文档-第二阶段-核心业务.md)** - 多租户、商品、用户、积分管理
- **[第三阶段：订单消息](需求/开发文档-第三阶段-订单消息.md)** - 订单管理、消息通知
- **[第四阶段：移动端](需求/开发文档-第四阶段-移动端.md)** - 移动端H5开发（待开发）
- **[第五阶段：测试部署](需求/开发文档-第五阶段-测试部署.md)** - 测试与部署（待开发）

### 后端文档
- **[数据库管理指南](backend/DATABASE_GUIDE.md)** - 数据库结构管理
- **[测试报告](backend/TEST_REPORT.md)** - 单元测试结果

---

## 🛠️ 技术栈

### 后端
- **框架**: Node.js + Express
- **数据库**: MySQL 8.0+
- **ORM**: Sequelize
- **认证**: JWT
- **测试**: Jest + Supertest

### 前端
- **框架**: Vue 3 + Vite
- **UI库**: Element Plus
- **状态管理**: Pinia
- **路由**: Vue Router
- **HTTP客户端**: Axios

---

## ✨ 功能特性

### 第一阶段：基础框架 ✅
- 用户认证与授权（JWT）
- 角色权限系统（管理员、运营方、普通用户）
- 管理员审核运营方
- 用户管理（重置密码、禁用/启用）
- 操作日志记录

### 第二阶段：核心业务 ✅
- 运营方注册与审核流程
- 普通用户申请加入运营方
- 商品管理（上架、下架、编辑）
- 积分管理（添加、减少、修改）
- 积分流水记录
- 用户与运营方关系管理

### 第三阶段：订单消息 ✅
- 订单管理（下单、查询、取消）
- 运营方订单管理（状态更新、导出CSV）
- 消息通知系统（8种场景）
- 消息中心（三种角色）
- Header消息角标（实时刷新）

### 第四阶段：移动端 ⏳
- 移动端H5页面开发

### 第五阶段：测试部署 ⏳
- 全面测试
- 性能优化
- 生产环境部署

---

## 💻 开发规范

- 遵循 RESTful API 设计规范
- 使用 ESLint + Prettier 保持代码风格一致
- 所有删除操作均为逻辑删除
- 敏感操作必须记录日志
- 数据库结构变更需同步更新 `init.sql`
- 提交前运行测试确保通过

---

## 🔌 API 文档

后端服务启动后：
- **基础URL**: http://localhost:8367/api/v1
- **详细接口**: 查看 `backend/src/routes/` 目录

---

## 📄 许可证

ISC

---

**最后更新**: 2026-04-16
