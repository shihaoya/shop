const winston = require('winston');
const config = require('../config');
const path = require('path');

// 创建日志目录
const fs = require('fs');
if (!fs.existsSync(config.log.filePath)) {
  fs.mkdirSync(config.log.filePath, { recursive: true });
}

// 创建logger实例
const logger = winston.createLogger({
  level: config.log.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat(),
    winston.format.json()
  ),
  defaultMeta: { service: 'point-exchange-api' },
  transports: [
    // 错误日志
    new winston.transports.File({
      filename: path.join(config.log.filePath, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 所有日志
    new winston.transports.File({
      filename: path.join(config.log.filePath, 'combined.log'),
      maxsize: 5242880,
      maxFiles: 10
    })
  ]
});

// 开发环境下输出到控制台
if (config.nodeEnv !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

/**
 * 日志中间件
 */
const logMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info({
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  
  next();
};

module.exports = {
  logger,
  logMiddleware
};
