const { sequelize } = require('../src/models/database');

async function addApplyReasonFields() {
  try {
    console.log('🔧 开始添加申请理由字段...');
    
    // 检查字段是否已存在
    const [results] = await sequelize.query(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'point_exchange_system' AND TABLE_NAME = 'user_tenant_relations' AND COLUMN_NAME IN ('apply_reason', 'reject_reason')"
    );
    
    const existingColumns = results.map(r => r.COLUMN_NAME);
    
    if (existingColumns.includes('apply_reason') && existingColumns.includes('reject_reason')) {
      console.log('✅ 字段已存在，无需添加');
      return;
    }
    
    // 添加 apply_reason 字段
    if (!existingColumns.includes('apply_reason')) {
      await sequelize.query(
        "ALTER TABLE `user_tenant_relations` ADD COLUMN `apply_reason` TEXT COMMENT '申请理由' AFTER `points_balance`"
      );
      console.log('✅ 添加 apply_reason 字段成功');
    }
    
    // 添加 reject_reason 字段
    if (!existingColumns.includes('reject_reason')) {
      await sequelize.query(
        "ALTER TABLE `user_tenant_relations` ADD COLUMN `reject_reason` TEXT COMMENT '拒绝理由' AFTER `apply_reason`"
      );
      console.log('✅ 添加 reject_reason 字段成功');
    }
    
    console.log('✅ 数据库迁移完成！');
  } catch (error) {
    console.error('❌ 迁移失败:', error);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

addApplyReasonFields();
