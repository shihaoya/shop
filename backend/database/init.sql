-- ============================================
-- 积分兑换系统 - 数据库初始化脚本
-- ============================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS point_exchange_system 
DEFAULT CHARACTER SET utf8mb4 
DEFAULT COLLATE utf8mb4_unicode_ci;

USE point_exchange_system;

-- ============================================
-- 1. 用户表
-- ============================================
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

-- ============================================
-- 2. 租户表
-- ============================================
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

-- ============================================
-- 3. 用户-租户关联表
-- ============================================
CREATE TABLE IF NOT EXISTS `user_tenant_relations` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '关联ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `tenant_id` INT UNSIGNED NOT NULL COMMENT '租户ID',
  `status` ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending' COMMENT '申请状态',
  `points_balance` INT NOT NULL DEFAULT 0 COMMENT '在该租户下的积分余额',
  `apply_reason` TEXT DEFAULT NULL COMMENT '申请理由',
  `reject_reason` TEXT DEFAULT NULL COMMENT '拒绝理由',
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

-- ============================================
-- 4. 商品表
-- ============================================
CREATE TABLE IF NOT EXISTS `products` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '商品ID',
  `tenant_id` INT UNSIGNED NOT NULL COMMENT '所属租户ID',
  `name` VARCHAR(100) NOT NULL COMMENT '商品名称',
  `description` TEXT DEFAULT NULL COMMENT '商品描述',
  `image_url` VARCHAR(255) DEFAULT NULL COMMENT '商品图片URL',
  `points_required` INT NOT NULL DEFAULT 0 COMMENT '所需积分',
  `stock` INT NOT NULL DEFAULT 0 COMMENT '库存数量',
  `category` VARCHAR(50) DEFAULT NULL COMMENT '商品分类',
  `status` ENUM('on_shelf', 'off_shelf') NOT NULL DEFAULT 'off_shelf' COMMENT '状态：on_shelf-上架，off_shelf-下架',
  `sort_order` INT NOT NULL DEFAULT 0 COMMENT '排序权重',
  `is_deleted` TINYINT NOT NULL DEFAULT 0 COMMENT '逻辑删除',
  `deleted_at` DATETIME DEFAULT NULL COMMENT '删除时间',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  INDEX `idx_tenant_id` (`tenant_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品表';

-- ============================================
-- 5. 积分流水表
-- ============================================
CREATE TABLE IF NOT EXISTS `point_transactions` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '流水ID',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `tenant_id` INT UNSIGNED NOT NULL COMMENT '租户ID',
  `transaction_type` ENUM('add', 'subtract', 'modify', 'exchange') NOT NULL COMMENT '交易类型：add-增加，subtract-减少，modify-修改，exchange-兑换',
  `points_change` INT NOT NULL COMMENT '积分变动数量（正数表示增加，负数表示减少）',
  `balance_after` INT NOT NULL COMMENT '变动后余额',
  `reason` VARCHAR(255) NOT NULL COMMENT '变动原因',
  `operator_id` INT UNSIGNED DEFAULT NULL COMMENT '操作人ID（运营方或系统）',
  `operator_name` VARCHAR(50) DEFAULT NULL COMMENT '操作人姓名',
  `related_order_id` INT UNSIGNED DEFAULT NULL COMMENT '关联订单ID（兑换时）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  INDEX `idx_user_tenant` (`user_id`, `tenant_id`),
  INDEX `idx_created_at` (`created_at`),
  INDEX `idx_transaction_type` (`transaction_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='积分流水表';

-- ============================================
-- 6. 操作日志表
-- ============================================
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

-- ============================================
-- 7. 租户审核历史表
-- ============================================
CREATE TABLE IF NOT EXISTS `tenant_audit_history` (
  `id` BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '审核历史ID',
  `tenant_id` INT UNSIGNED NOT NULL COMMENT '租户ID',
  `previous_status` ENUM('pending', 'approved', 'rejected', 'disabled') DEFAULT NULL COMMENT '审核前状态',
  `new_status` ENUM('pending', 'approved', 'rejected', 'disabled') NOT NULL COMMENT '审核后状态',
  `audit_result` ENUM('approved', 'rejected') NOT NULL COMMENT '审核结果：approved-通过，rejected-拒绝',
  `reject_reason` TEXT DEFAULT NULL COMMENT '拒绝原因（如果拒绝）',
  `auditor_id` INT UNSIGNED NOT NULL COMMENT '审核人ID（管理员）',
  `auditor_username` VARCHAR(50) DEFAULT NULL COMMENT '审核人用户名',
  `remark` TEXT DEFAULT NULL COMMENT '审核备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '审核时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`auditor_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  INDEX `idx_tenant_id` (`tenant_id`),
  INDEX `idx_auditor_id` (`auditor_id`),
  INDEX `idx_audit_result` (`audit_result`),
  INDEX `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='租户审核历史表';

-- ============================================
-- 8. 订单表
-- ============================================
CREATE TABLE IF NOT EXISTS `orders` (
  `id` INT UNSIGNED AUTO_INCREMENT PRIMARY KEY COMMENT '订单ID',
  `order_no` VARCHAR(50) NOT NULL UNIQUE COMMENT '订单号',
  `user_id` INT UNSIGNED NOT NULL COMMENT '用户ID',
  `tenant_id` INT UNSIGNED NOT NULL COMMENT '租户ID（运营方）',
  `product_id` INT UNSIGNED NOT NULL COMMENT '商品ID',
  `product_name` VARCHAR(200) NOT NULL COMMENT '商品名称（快照）',
  `points_cost` INT NOT NULL COMMENT '消耗积分',
  `quantity` INT UNSIGNED NOT NULL DEFAULT 1 COMMENT '兑换数量',
  `total_points` INT NOT NULL COMMENT '总消耗积分',
  `status` ENUM('pending', 'completed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '订单状态：pending-待处理，completed-已完成，cancelled-已取消',
  `recipient_name` VARCHAR(50) DEFAULT NULL COMMENT '收货人姓名',
  `recipient_phone` VARCHAR(20) DEFAULT NULL COMMENT '收货人电话',
  `recipient_address` TEXT DEFAULT NULL COMMENT '收货地址',
  `remark` TEXT DEFAULT NULL COMMENT '备注',
  `is_deleted` TINYINT UNSIGNED NOT NULL DEFAULT 0 COMMENT '是否删除：0-未删除，1-已删除',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`tenant_id`) REFERENCES `tenants`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON DELETE CASCADE,
  INDEX `idx_order_no` (`order_no`),
  INDEX `idx_user_id` (`user_id`),
  INDEX `idx_tenant_id` (`tenant_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_is_deleted` (`is_deleted`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- ============================================
-- 初始化数据
-- ============================================

-- 插入默认管理员账号（密码: Admin@123456）
-- 注意：实际使用时需要用bcrypt加密后的密码替换下面的哈希值
INSERT INTO `users` (`username`, `password`, `nickname`, `role`, `status`) 
VALUES ('admin', '$2a$10$YourHashedPasswordHere', '系统管理员', 'admin', 1)
ON DUPLICATE KEY UPDATE `username` = `username`;
