# 后端项目启动指南

## 前置要求
- Node.js 18+ 已安装
- MySQL 8.0+ 已安装并运行
- npm 或 yarn 已安装

## 启动步骤

### 第一步：安装依赖
进入backend目录并安装依赖：
```bash
cd backend
npm install
```

### 第二步：配置数据库
1. 确保MySQL服务正在运行
2. 修改 `.env` 文件中的数据库配置：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=point_exchange_system
```

### 第三步：初始化数据库
在MySQL中执行初始化脚本：
```bash
mysql -u root -p < database/init.sql
```

或者手动执行 `database/init.sql` 文件中的SQL语句。

### 第四步：创建管理员账号
由于bcrypt密码需要加密，请运行以下Node.js脚本生成管理员密码：

创建一个临时文件 `create-admin.js`：
```javascript
const bcrypt = require('bcryptjs');
const password = 'Admin@123456';
bcrypt.hash(password, 10).then(hash => {
  console.log(' hashed password:', hash);
});
```

运行：
```bash
node create-admin.js
```

将生成的哈希值替换到 `database/init.sql` 中的密码字段，然后重新执行SQL，或者直接在数据库中更新：
```sql
UPDATE users SET password = '生成的哈希值' WHERE username = 'admin';
```

### 第五步：启动服务
```bash
# 开发模式（支持热重载）
npm run dev

# 或生产模式
npm start
```

### 第六步：测试接口
服务启动后，访问 http://localhost:8367/api/v1/health 应该返回：
```json
{
  "status": "ok",
  "timestamp": "2026-04-15T..."
}
```

## 测试登录接口

使用curl或Postman测试登录：

```bash
curl -X POST http://localhost:8367/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "Admin@123456"
  }'
```

成功响应：
```json
{
  "code": 200,
  "message": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "expiresIn": "2h",
    "user": {
      "id": 1,
      "username": "admin",
      "nickname": "系统管理员",
      "role": "admin"
    }
  }
}
```

## 常见问题

### 1. 数据库连接失败
- 检查MySQL服务是否启动
- 检查 `.env` 中的数据库配置是否正确
- 确认数据库用户有足够权限

### 2. 端口被占用
修改 `.env` 中的 `PORT` 为其他端口，如 `8368`

### 3. 模块找不到
删除 `node_modules` 文件夹，重新运行 `npm install`

### 4. JWT密钥警告
务必在生产环境中修改 `JWT_SECRET` 为强随机字符串

## 下一步
后端基础框架已完成，接下来可以：
1. 测试所有认证接口
2. 开始开发前端PC端项目
3. 继续实现第二阶段的核心业务模块
