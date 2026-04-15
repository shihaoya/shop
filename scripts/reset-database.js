/**
 * 重置数据库脚本
 * 
 * 用途：
 * 1. 删除现有数据库
 * 2. 重新创建数据库
 * 3. 通过Sequelize自动创建所有表结构
 * 4. 创建默认管理员账号
 * 
 * 使用方法：
 * node scripts/reset-database.js
 * 
 * 注意：
 * - 此操作会删除所有数据！仅用于开发环境
 * - 确保MySQL服务正在运行
 * - MySQL密码请在 backend/.env 中配置
 */

const path = require('path');
const fs = require('fs');

// 检查backend目录是否存在
const backendPath = path.join(__dirname, '..', 'backend');
if (!fs.existsSync(backendPath)) {
  console.error('❌ 错误：请在项目根目录下运行此脚本');
  console.error('   正确用法: node scripts/reset-database.js\n');
  process.exit(1);
}

// 从 backend 目录加载依赖
const dotenv = require(path.join(backendPath, 'node_modules', 'dotenv'));
dotenv.config({ path: path.join(backendPath, '.env') });
const { Sequelize } = require(path.join(backendPath, 'node_modules', 'sequelize'));
const bcrypt = require(path.join(backendPath, 'node_modules', 'bcryptjs'));

// 加载配置
const configPath = path.join(__dirname, '..', 'backend', 'src', 'config', 'index.js');
const config = require(configPath);

const dbConfig = config.database;

async function resetDatabase() {
  console.log('\n========================================');
  console.log('  数据库重置工具');
  console.log('========================================\n');
  
  try {
    console.log(`📋 数据库信息：`);
    console.log(`   主机: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`   数据库: ${dbConfig.database}`);
    console.log(`   用户: ${dbConfig.username}\n`);
    
    // 1. 连接到MySQL服务器（先不指定数据库）
    console.log('🔌 正在连接MySQL服务器...');
    const tempSequelize = new Sequelize(
      dbConfig.database,
      dbConfig.username,
      dbConfig.password,
      {
        host: dbConfig.host,
        port: dbConfig.port,
        dialect: dbConfig.dialect,
        logging: false
      }
    );
    
    await tempSequelize.authenticate();
    console.log('✅ MySQL服务器连接成功\n');
    
    // 2. 删除并重建数据库
    console.log('🗑️  正在删除现有数据库...');
    await tempSequelize.query(`DROP DATABASE IF EXISTS \`${dbConfig.database}\``);
    console.log('✅ 数据库已删除\n');
    
    console.log('📦 正在创建新数据库...');
    await tempSequelize.query(
      `CREATE DATABASE \`${dbConfig.database}\` DEFAULT CHARACTER SET utf8mb4 DEFAULT COLLATE utf8mb4_unicode_ci`
    );
    console.log('✅ 数据库已创建\n');
    
    await tempSequelize.close();
    
    // 3. 导入模型（模型使用database.js中的sequelize实例）
    console.log('📂 正在导入模型...');
    const { User, Tenant, UserTenantRelation, OperationLog } = require(
      path.join(__dirname, '..', 'backend', 'src', 'models')
    );
    console.log('✅ 模型导入完成\n');
    
    // 4. 通过database.js的sequelize同步（模型已绑定到这个实例）
    console.log('🔨 正在创建数据表...');
    const { sequelize, testConnection } = require(
      path.join(__dirname, '..', 'backend', 'src', 'models', 'database')
    );
    await testConnection();
    await sequelize.sync({ force: true });
    console.log('✅ 数据表创建完成\n');
    
    // 5. 创建默认管理员账号
    console.log('👤 正在创建默认管理员账号...');
    const adminPassword = 'Admin@123456';
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    await User.create({
      username: 'admin',
      password: hashedPassword,
      nickname: '系统管理员',
      role: 'admin',
      status: 1
    });
    
    console.log('✅ 管理员账号创建完成\n');
    console.log(`   用户名: admin`);
    console.log(`   密码: ${adminPassword}\n`);
    
    console.log('========================================');
    console.log('  ✅ 数据库重置完成！');
    console.log('========================================\n');
    console.log('💡 提示：');
    console.log('   - 现在可以启动后端服务了');
    console.log('   - 使用 admin / Admin@123456 登录系统\n');
    
    // 关闭连接
    await sequelize.close();
    
  } catch (error) {
    console.error('\n❌ 数据库重置失败:');
    console.error('   错误信息:', error.message);
    if (error.original) {
      console.error('   原始错误:', error.original.message);
    }
    console.error('\n请检查：');
    console.error('   1. MySQL服务是否正在运行');
    console.error('   2. 数据库用户名和密码是否正确');
    console.error('   3. 是否有权限创建/删除数据库\n');
    process.exit(1);
  }
}

// 执行
resetDatabase();
