const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env.test' });

async function createTestDatabase() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root'
  });

  try {
    // 创建测试数据库（如果不存在）
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ 测试数据库 ${process.env.DB_NAME} 创建成功`);
  } catch (error) {
    console.error('❌ 创建测试数据库失败:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

createTestDatabase();
