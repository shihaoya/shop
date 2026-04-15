require('dotenv').config();

module.exports = {
  port: process.env.PORT || 8367,
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
      max: 10,
      min: 0,
      acquire: 30000,
      idle: 10000
    },
    define: {
      timestamps: true,
      underscored: true,
      charset: 'utf8mb4',
      collate: 'utf8mb4_unicode_ci'
    }
  },
  
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d'
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:8366',
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
