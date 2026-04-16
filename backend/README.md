# 积分兑换系统 - 后端API

## 项目简介
积分兑换系统的后端API服务，基于Node.js + Express + MySQL开发。

## 技术栈
- **运行环境**: Node.js 18+
- **Web框架**: Express.js
- **ORM**: Sequelize
- **数据库**: MySQL 8.0+
- **认证**: JWT
- **密码加密**: bcryptjs

## 目录结构
```
backend/
├── src/
│   ├── config/           # 配置文件
│   ├── models/           # 数据模型
│   ├── controllers/      # 控制器
│   ├── services/         # 业务逻辑层
│   ├── middlewares/      # 中间件
│   ├── routes/           # 路由
│   ├── utils/            # 工具函数
│   └── app.js            # 应用入口
├── database/             # 数据库脚本
├── .env                  # 环境变量
└── package.json
```

## 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env` 文件并修改配置：
```bash
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=point_exchange_system
JWT_SECRET=your_secret_key
```

### 3. 初始化数据库
执行 `database/init.sql` 脚本创建数据库和表：
```bash
mysql -u root -p < database/init.sql
```

### 4. 启动服务
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

服务将在 `http://localhost:18634` 启动

## API接口

### 认证接口
- `POST /api/v1/auth/register` - 用户注册
- `POST /api/v1/auth/login` - 用户登录
- `POST /api/v1/auth/refresh` - 刷新Token
- `POST /api/v1/auth/logout` - 退出登录

### 管理员接口
- `GET /api/v1/admin/tenants/pending` - 待审核列表
- `POST /api/v1/admin/tenants/:id/approve` - 通过审核
- `POST /api/v1/admin/tenants/:id/reject` - 拒绝审核
- `GET /api/v1/admin/users` - 用户列表
- `POST /api/v1/admin/users/:id/reset-password` - 重置密码
- `PUT /api/v1/admin/users/:id/status` - 修改状态

### 健康检查
- `GET /api/v1/health` - 健康检查

## 默认账号
- 用户名: `admin`
- 密码: `Admin@123456`

**注意**: 首次使用前需要手动创建管理员账号，或使用提供的SQL脚本。

## 开发规范
- 使用ESLint进行代码检查
- 使用Prettier进行代码格式化
- 遵循RESTful API设计规范
- 所有接口统一响应格式: `{code, message, data}`

## 注意事项
1. 首次运行前必须先配置数据库连接信息
2. JWT密钥请在生产环境中使用强随机字符串
3. 建议启用HTTPS以保证数据传输安全
4. 定期备份数据库

## 许可证
ISC
