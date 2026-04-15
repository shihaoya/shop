const winston = require('winston');
const config = require('../config');
const path = require('path');

// 创建日志目录
const fs = require('fs');
if (!fs.existsSync(config.log.filePath)) {
  fs.mkdirSync(config.log.filePath, { recursive: true });
}

// 日志格式化函数 - 清晰易读
const logFormat = winston.format.printf(({ level, message, timestamp, ...meta }) => {
  let msg = message;
  
  // 处理对象类型的消息
  if (typeof message === 'object') {
    msg = JSON.stringify(message, null, 2);
  }
  
  // 添加元数据（排除已记录的字段）
  let metaStr = '';
  if (meta && Object.keys(meta).length > 0) {
    const filteredMeta = {};
    for (const [key, value] of Object.entries(meta)) {
      if (value !== undefined && value !== null && key !== 'service') {
        filteredMeta[key] = value;
      }
    }
    if (Object.keys(filteredMeta).length > 0) {
      metaStr = '\n' + JSON.stringify(filteredMeta, null, 2);
    }
  }
  
  return `[${timestamp}] ${level.toUpperCase()}: ${msg}${metaStr}`;
});

// 错误日志特殊格式（包含堆栈）
const errorFormat = winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
  let msg = message;
  
  if (typeof message === 'object') {
    msg = JSON.stringify(message, null, 2);
  }
  
  // 添加堆栈信息
  let stackStr = stack ? '\nStack Trace:\n' + stack : '';
  
  // 添加元数据
  let metaStr = '';
  if (meta && Object.keys(meta).length > 0) {
    const filteredMeta = {};
    for (const [key, value] of Object.entries(meta)) {
      if (value !== undefined && value !== null && key !== 'service') {
        filteredMeta[key] = value;
      }
    }
    if (Object.keys(filteredMeta).length > 0) {
      metaStr = '\nDetails:\n' + JSON.stringify(filteredMeta, null, 2);
    }
  }
  
  return `[${timestamp}] ${level.toUpperCase()}: ${msg}${stackStr}${metaStr}`;
});

// 创建logger实例
const logger = winston.createLogger({
  level: config.log.level,
  format: winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.splat()
  ),
  defaultMeta: { service: 'point-exchange-api' },
  transports: [
    // 错误日志 - 使用特殊格式，只记录错误级别
    new winston.transports.File({
      filename: path.join(config.log.filePath, 'error.log'),
      level: 'error',
      format: errorFormat,
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    // 警告日志
    new winston.transports.File({
      filename: path.join(config.log.filePath, 'warn.log'),
      level: 'warn',
      format: logFormat,
      maxsize: 5242880,
      maxFiles: 5
    }),
    // 所有日志（包括info）
    new winston.transports.File({
      filename: path.join(config.log.filePath, 'combined.log'),
      format: logFormat,
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
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.printf(({ level, message, timestamp, ...meta }) => {
        let msg = message;
        if (typeof message === 'object') {
          msg = JSON.stringify(message, null, 2);
        }
        return `[${timestamp}] ${level}: ${msg}`;
      })
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
