const bcrypt = require('bcryptjs');
const { sequelize } = require('../src/models/database');
const User = require('../src/models/User');

async function initAdminAccount() {
  try {
    console.log('🔄 正在初始化数据库连接...');
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功');

    // 检查是否已存在admin用户
    const existingAdmin = await User.findOne({
      where: { username: 'admin' }
    });

    if (existingAdmin) {
      console.log('⚠️  管理员账号已存在，跳过创建');
      console.log(`   用户名: admin`);
      console.log(`   角色: ${existingAdmin.role}`);
      console.log(`   状态: ${existingAdmin.status === 1 ? '启用' : '禁用'}`);
      return;
    }

    // 创建管理员账号
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    
    const admin = await User.create({
      username: 'admin',
      password: hashedPassword,
      nickname: '系统管理员',
      role: 'admin',
      status: 1,
      isDeleted: 0
    });

    console.log('✅ 管理员账号创建成功！');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📋 登录信息：');
    console.log(`   用户名: admin`);
    console.log(`   密码: Admin@123456`);
    console.log(`   角色: ${admin.role}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('⚠️  请及时修改默认密码！');

  } catch (error) {
    console.error('❌ 创建管理员账号失败:', error.message);
    throw error;
  } finally {
    await sequelize.close();
    console.log('✅ 数据库连接已关闭');
  }
}

// 执行初始化
initAdminAccount();

