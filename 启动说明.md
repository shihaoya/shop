# 项目启动说明

## 前置条件
1. Node.js 18+ 已安装
2. MySQL 8.0+ 已安装并运行
3. npm 或 yarn 已安装

## 第一步：启动后端服务

### 1. 进入后端目录
```bash
cd backend
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置数据库
编辑 `.env` 文件，修改以下配置：
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=你的MySQL密码
DB_NAME=point_exchange_system
JWT_SECRET=生成的随机字符串（至少32位）
```

生成JWT密钥的命令：
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. 初始化数据库
```bash
mysql -u root -p < database/init.sql
```

### 5. 创建管理员账号
执行以下SQL创建管理员（密码: Admin@123456）：
```sql
-- 先用Node.js生成bcrypt哈希
node -e "const bcrypt=require('bcryptjs');bcrypt.hash('Admin@123456',10).then(h=>console.log(h));"

-- 将输出的哈希值替换到下面的SQL中
UPDATE users SET password='生成的哈希值' WHERE username='admin';
```

或者直接在数据库中插入：
```sql
INSERT INTO users (username, password, nickname, role, status) 
VALUES ('admin', '用上面命令生成的哈希值', '系统管理员', 'admin', 1);
```

### 6. 启动后端服务
```bash
npm run dev
```

后端将在 http://localhost:8367 启动

---

## 第二步：启动前端服务

### 1. 进入前端目录
```bash
cd frontend-pc
```

### 2. 安装依赖（如果还没安装）
```bash
npm install
```

### 3. 启动前端服务
```bash
npm run dev
```

前端将在 http://localhost:8366 启动

---

## 测试登录

1. 打开浏览器访问 http://localhost:8366
2. 使用管理员账号登录：
   - 用户名：admin
   - 密码：Admin@123456

---

## 常见问题

### 1. 后端启动失败
- 检查MySQL是否运行
- 检查.env中的数据库配置是否正确
- 检查端口8367是否被占用

### 2. 前端启动失败
- 检查node_modules是否完整安装
- 检查端口8366是否被占用
- 查看控制台错误信息

### 3. 登录失败
- 确认后端服务正在运行
- 确认数据库已正确初始化
- 确认管理员账号已创建
- 检查浏览器控制台的错误信息

### 4. CORS错误
- 确认后端.env中的CORS_ORIGIN配置为 http://localhost:8366
- 重启后端服务

---

## 开发提示

- 后端支持热重载（nodemon）
- 前端支持热模块替换（HMR）
- 修改代码后会自动刷新
- 查看浏览器控制台和终端日志排查问题
