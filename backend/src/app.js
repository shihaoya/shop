const express = require('express');
const cors = require('cors');
const config = require('./config');
const { sequelize, testConnection } = require('./models/database');
const routes = require('./routes');
const { logMiddleware, logger } = require('./middlewares/logger');
const { error } = require('./utils/response');

const app = express();

// 中间件
app.use(cors(config.cors));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logMiddleware);

// 路由
app.use('/api/v1', routes);

// 404处理
app.use((req, res) => {
  return error(res, '接口不存在', 404);
});

// 全局错误处理
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  return error(res, '服务器内部错误', 500);
});

// 启动服务器
const startServer = async () => {
  try {
    // 测试数据库连接
    await testConnection();
    
    // 同步数据库模型（开发环境）
    if (config.nodeEnv === 'development') {
      await sequelize.sync({ alter: false });
      console.log('数据库模型同步完成');
    }
    
    // 启动服务
    app.listen(config.port, () => {
      console.log(`服务器运行在 http://localhost:${config.port}`);
      console.log(`环境: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('服务器启动失败:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app;
