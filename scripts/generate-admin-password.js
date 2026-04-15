/**
 * 生成管理员密码哈希值脚本
 * 
 * 用途：
 * 1. 为管理员账号生成bcrypt加密的密码哈希
 * 2. 输出可直接在MySQL中执行的SQL语句
 * 
 * 使用方法：
 * node scripts/generate-admin-password.js
 * 
 * 注意：
 * - 默认密码为 Admin@123456
 * - 如需修改密码，请编辑本文件中的 password 变量
 * - 生成的哈希值每次运行都不同（因为salt随机）
 */

const path = require('path');
const fs = require('fs');

// 检查是否在正确的目录下运行
const backendPath = path.join(__dirname, '..', 'backend');
if (!fs.existsSync(backendPath)) {
  console.error('❌ 错误：请在项目根目录下运行此脚本');
  console.error('   正确用法: node scripts/generate-admin-password.js\n');
  process.exit(1);
}

// 从 backend 目录加载 bcryptjs
const bcrypt = require(path.join(backendPath, 'node_modules', 'bcryptjs'));

// 配置：管理员密码
const PASSWORD = 'Admin@123456';
const USERNAME = 'admin';
const NICKNAME = '系统管理员';
const ROLE = 'admin';

async function generatePasswordHash() {
  try {
    console.log('\n========================================');
    console.log('  管理员密码哈希生成工具');
    console.log('========================================\n');
    
    // 生成密码哈希
    const hash = await bcrypt.hash(PASSWORD, 10);
    
    console.log('📋 基本信息：');
    console.log(`   用户名: ${USERNAME}`);
    console.log(`   昵称: ${NICKNAME}`);
    console.log(`   角色: ${ROLE}`);
    console.log(`   明文密码: ${PASSWORD}`);
    console.log('\n🔐 密码哈希值：');
    console.log(`   ${hash}\n`);
    
    console.log('========================================');
    console.log('  SQL 执行语句');
    console.log('========================================\n');
    
    console.log('✅ 如果 admin 用户已存在，执行：\n');
    console.log(`UPDATE users SET password='${hash}' WHERE username='${USERNAME}';\n`);
    
    console.log('✅ 如果 admin 用户不存在，执行：\n');
    console.log(`INSERT INTO users (username, password, nickname, role, status)`);
    console.log(`VALUES ('${USERNAME}', '${hash}', '${NICKNAME}', '${ROLE}', 1);\n`);
    
    console.log('========================================\n');
    console.log('💡 提示：复制上面的SQL语句到MySQL客户端执行即可\n');
    
  } catch (error) {
    console.error('❌ 生成密码失败:', error.message);
    process.exit(1);
  }
}

// 执行
generatePasswordHash();
