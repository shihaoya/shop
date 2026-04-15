-- 创建数据库
CREATE DATABASE IF NOT EXISTS point_exchange_system 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE point_exchange_system;

-- 用户表
CREATE TABLE IF NOT EXISTS `users` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '用户ID',
  `username` VARCHAR(50) NOT NULL UNIQUE COMMENT '用户名',
  `password` VARCHAR(255) NOT NULL COMMENT '密码（bcrypt加密）',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `role` ENUM('admin', 'operator', 'user') NOT NULL DEFAULT 'user' COMMENT '角色',
  `status` TINYINT NOT NULL DEFAULT 1 COMMENT '状态：0-禁用，1-启用',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除：0-未删除，1-已删除',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `login_fail_count` INT NOT NULL DEFAULT 0 COMMENT '登录失败次数',
  `locked_until` DATETIME DEFAULT NULL COMMENT '锁定到期时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  INDEX `idx_username` (`username`),
  INDEX `idx_role` (`role`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- 租户表
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '租户ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '关联的用户ID（运营方）',
  `name` VARCHAR(100) NOT NULL COMMENT '租户名称',
  `description` TEXT DEFAULT NULL COMMENT '申请描述',
  `status` ENUM('pending', 'approved', 'rejected', 'disabled') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `reject_reason` TEXT DEFAULT NULL COMMENT '拒绝原因',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租户表';

-- 用户-租户关联表
CREATE TABLE IF NOT EXISTS `user_tenant_relations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `tenant_id` INT UNSIGNED NOT NULL COMMENT '租户ID',
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' COMMENT '申请状态',
  `points_balance` INT NOT NULL DEFAULT 0 COMMENT '在该租户下的积分余额',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uk_user_tenant` (`user_id`, `tenant_id`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户-租户关联表';

-- 操作日志表
CREATE TABLE IF NOT EXISTS `operation_logs` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '日志ID',
  `user_id` INT UNSIGNED DEFAULT NULL COMMENT '操作用户ID',
  `username` VARCHAR(50) DEFAULT NULL COMMENT '操作用户名',
  `operation_type` VARCHAR(50) NOT NULL COMMENT '操作类型',
  `operation_module` VARCHAR(50) NOT NULL COMMENT '操作模块',
  `operation_desc` TEXT NOT NULL COMMENT '操作描述',
  `request_method` VARCHAR(10) DEFAULT NULL COMMENT '请求方法',
  `request_url` VARCHAR(255) DEFAULT NULL COMMENT '请求URL',
  `request_params` TEXT DEFAULT NULL COMMENT '请求参数（JSON）',
  `response_code` INT DEFAULT NULL COMMENT '响应码',
  `ip_address` VARCHAR(50) DEFAULT NULL COMMENT 'IP地址',
  `user_agent` VARCHAR(255) DEFAULT NULL COMMENT '用户代理',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '操作时间',
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_operation_type` (`operation_type`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='操作日志表';

-- 插入默认管理员账号（密码: Admin@123456）
-- 注意：实际使用时需要用bcrypt加密后的密码替换下面的哈希值
INSERT INTO `users` (`username`, `password`, `nickname`, `role`, `status`) 
VALUES ('admin', '$2a$10$YourHashedPasswordHere', '系统管理员', 'admin', 1)
ON DUPLICATE KEY UPDATE `username` = `username`;
