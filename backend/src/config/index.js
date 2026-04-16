const path = require('path');

// 根据环境加载对应的 .env 文件
const envFile = process.env.NODE_ENV === 'test' ? '.env.test' : '.env';
require('dotenv').config({ path: path.resolve(__dirname, '../../', envFile) });

console.log(`📝 加载配置文件: ${envFile} (NODE_ENV=${process.env.NODE_ENV})`);

module.exports = {
  port: process.env.PORT || 18634,
  nodeEnv: process.env.NODE_ENV || 'development',
  
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'point_exchange_system',
    dialect: 'mysql',
    timezone: '+08:00',
    pool: {
      max: process.env.NODE_ENV === 'test' ? 5 : 10,  // 测试环境减少连接数
      min: 0,
      acquire: process.env.NODE_ENV === 'test' ? 60000 : 30000,  // 测试环境增加超时时间
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    },
    // 测试环境额外配置
    logging: process.env.NODE_ENV === 'test' ? false : console.log,
    benchmark: process.env.NODE_ENV === 'test'
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:18635',
    credentials: true
  },
  
  log: {
    level: process.env.LOG_LEVEL || 'debug',
    filePath: './logs'
  },
  
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads'
  }
};
