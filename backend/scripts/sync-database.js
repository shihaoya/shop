/**
 * 数据库结构同步脚本
 * 检查并同步所有模型到数据库
 */
const { sequelize } = require('../src/models/database');
const models = require('../src/models');

async function syncDatabase() {
  try {
    console.log('🔧 开始同步数据库结构...\n');
    
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✅ 数据库连接成功\n');
    
    // 同步所有模型（不删除现有数据）
    await sequelize.sync({ alter: false });
    
    console.log('✅ 数据库结构同步完成！\n');
    console.log('📋 已同步的表：');
    console.log('   1. users - 用户表');
    console.log('   2. tenants - 租户表');
    console.log('   3. user_tenant_relations - 用户-租户关联表');
    console.log('   4. products - 商品表');
    console.log('   5. point_transactions - 积分流水表');
    console.log('   6. operation_logs - 操作日志表');
    console.log('   7. tenant_audit_history - 租户审核历史表');
    console.log('\n💡 提示：');
    console.log('   - 如果表不存在，会自动创建');
    console.log('   - 如果表已存在，不会修改现有结构');
    console.log('   - 如需完整重建，请手动删除数据库后运行 init.sql\n');
    
  } catch (error) {
    console.error('❌ 数据库同步失败:', error.message);
    console.error('\n完整错误信息：');
    console.error(error);
    throw error;
  } finally {
    await sequelize.close();
  }
}

syncDatabase();
