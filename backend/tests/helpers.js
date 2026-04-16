const { sequelize } = require('../src/models');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../src/config');

// API基础路径
const API_BASE = '/api/v1';

/**
 * 测试前初始化数据库
 */
beforeAll(async () => {
  try {
    console.log('🔄 开始初始化测试数据库...');
    const startTime = Date.now();
    
    // 同步数据库结构（测试环境使用force重建表）
    const env = process.env.NODE_ENV;
    const force = env === 'test';
    await sequelize.sync({ force });
    
    const duration = Date.now() - startTime;
    console.log(`✅ 数据库连接成功 (${force ? '已重建表' : '保留现有数据'}) - 耗时: ${duration}ms`);
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('错误详情:', error);
    throw error;
  }
}, 30000); // 设置 30 秒超时

/**
 * 测试后关闭数据库连接
 */
afterAll(async () => {
  try {
    await sequelize.close();
    console.log('✅ 数据库连接已关闭');
  } catch (error) {
    console.error('关闭数据库连接失败:', error);
  }
});

/**
 * 创建测试用户
 */
async function createTestUser(userData) {
  const { User } = require('../src/models');
  
  const defaultData = {
    username: `test_user_${Date.now()}`,
    password: 'Test123456',
    nickname: '测试用户',
    role: 'user',
    status: 1,
    ...userData
  };
  
  // 加密密码
  const hashedPassword = await bcrypt.hash(defaultData.password, 10);
  
  const user = await User.create({
    ...defaultData,
    password: hashedPassword
  });
  
  return user;
}

/**
 * 生成测试Token
 */
function generateTestToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role
  };
  
  return jwt.sign(payload, config.jwt.secret, { 
    expiresIn: config.jwt.expiresIn 
  });
}

/**
 * 清理测试数据
 */
async function cleanupTestData() {
  const { User, Tenant, UserTenantRelation, Product, PointTransaction } = require('../src/models');
  
  // 按依赖关系逆序删除
  await PointTransaction.destroy({ where: {}, force: true });
  await Product.destroy({ where: {}, force: true });
  await UserTenantRelation.destroy({ where: {}, force: true });
  await Tenant.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
}

module.exports = {
  API_BASE,
  createTestUser,
  generateTestToken,
  cleanupTestData
};
