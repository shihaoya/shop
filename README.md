# 积分兑换系统

一个基于 Node.js + Vue.js + MySQL 的多租户积分兑换管理系统。

## 项目简介

本系统为运营方（商家或个人）提供积分兑换礼品活动的管理工具，支持多租户架构，每个运营方独立管理自己的商品、用户和积分体系。

## 技术栈

### 后端
- **框架**: Node.js + Express
- **数据库**: MySQL 8.0+
- **ORM**: Sequelize
- **认证**: JWT
- **密码加密**: bcryptjs

### 前端（计划中）
- **PC端**: Vue 3 + Vite + Element Plus
- **移动端**: Vue 3 + Vite + Vant

## 项目结构

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
│   └── ...
├── frontend-pc/         # PC端前端（待开发）
├── frontend-mobile/     # 移动端前端（待开发）
└── 需求/                # 需求文档
    ├── 需求描述.md
    ├── 积分兑换系统需求规格说明书.md
    ├── 操作流程文档.md
    └── 开发文档-*.md
```

## 快速开始

### 后端启动

```bash
cd backend
npm install
# 配置 .env 文件
# 初始化数据库
mysql -u root -p < database/init.sql
# 启动服务
npm run dev
```

后端服务将在 http://localhost:8367 启动

### 前端启动（待开发）

```bash
cd frontend-pc
npm install
npm run dev
```

前端服务将在 http://localhost:8366 启动

## 功能特性

### 第一阶段（已完成）
- ✅ 用户认证与授权
- ✅ JWT Token 管理
- ✅ 管理员审核运营方
- ✅ 用户管理（重置密码、禁用/启用）
- ✅ 操作日志记录

### 第二阶段（计划中）
- 📋 商品管理
- 📋 用户管理（运营方）
- 📋 积分管理
- 📋 普通用户功能

### 第三阶段（计划中）
- 📋 订单管理
- 📋 消息通知
- 📋 日志管理

### 第四阶段（计划中）
- 📋 移动端开发

## 默认账号

- **管理员账号**: admin
- **默认密码**: Admin@123456

⚠️ **注意**: 首次使用前请修改默认密码！

## 端口配置

- 后端 API: 8367
- 前端 PC: 8366

## 文档

详细文档请查看 `需求/` 目录：
- [需求规格说明书](需求/积分兑换系统需求规格说明书.md)
- [操作流程文档](需求/操作流程文档.md)
- [开发文档](需求/开发文档-第一阶段-基础框架.md)

## 开发规范

- 遵循 RESTful API 设计规范
- 使用 ESLint + Prettier 保持代码风格一致
- 所有删除操作均为逻辑删除
- 敏感操作必须记录日志

## 许可证

ISC
