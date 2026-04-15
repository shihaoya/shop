const { sequelize } = require('./src/models/database');
const fs = require('fs');
const path = require('path');

async function checkDatabaseStructure() {
  try {
    // 测试数据库连接
    await sequelize.authenticate();
    console.log('✓ 数据库连接成功\n');

    // 获取所有表名
    const [tables] = await sequelize.query(
      "SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = 'point_exchange_system'"
    );
    
    console.log('=== 数据库中的表 ===');
    tables.forEach(table => {
      console.log(`- ${table.TABLE_NAME}`);
    });
    console.log('');

    // 检查每个表的结构
    for (const table of tables) {
      const tableName = table.TABLE_NAME;
      console.log(`\n=== 表: ${tableName} ===`);
      
      // 获取列信息
      const [columns] = await sequelize.query(
        `SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE, COLUMN_DEFAULT, COLUMN_KEY, EXTRA, CHARACTER_MAXIMUM_LENGTH 
         FROM INFORMATION_SCHEMA.COLUMNS 
         WHERE TABLE_SCHEMA = 'point_exchange_system' AND TABLE_NAME = '${tableName}'
         ORDER BY ORDINAL_POSITION`
      );
      
      columns.forEach(col => {
        let typeInfo = col.DATA_TYPE;
        if (col.CHARACTER_MAXIMUM_LENGTH) {
          typeInfo += `(${col.CHARACTER_MAXIMUM_LENGTH})`;
        }
        
        const nullable = col.IS_NULLABLE === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.COLUMN_DEFAULT !== null ? `DEFAULT ${col.COLUMN_DEFAULT}` : '';
        const key = col.COLUMN_KEY ? `[${col.COLUMN_KEY}]` : '';
        const extra = col.EXTRA ? `(${col.EXTRA})` : '';
        
        console.log(`  ${col.COLUMN_NAME}: ${typeInfo} ${nullable} ${defaultVal} ${key} ${extra}`);
      });
      
      // 获取索引信息
      const [indexes] = await sequelize.query(
        `SELECT INDEX_NAME, COLUMN_NAME, NON_UNIQUE, SEQ_IN_INDEX 
         FROM INFORMATION_SCHEMA.STATISTICS 
         WHERE TABLE_SCHEMA = 'point_exchange_system' AND TABLE_NAME = '${tableName}'
         ORDER BY INDEX_NAME, SEQ_IN_INDEX`
      );
      
      if (indexes.length > 0) {
        console.log('\n  索引:');
        let currentIndex = null;
        indexes.forEach(idx => {
          if (currentIndex !== idx.INDEX_NAME) {
            currentIndex = idx.INDEX_NAME;
            const unique = idx.NON_UNIQUE == 0 ? 'UNIQUE' : 'INDEX';
            console.log(`    ${unique} ${idx.INDEX_NAME}:`);
          }
          console.log(`      - ${idx.COLUMN_NAME}`);
        });
      }
    }

    console.log('\n✓ 数据库结构检查完成');
    
  } catch (error) {
    console.error('✗ 检查数据库结构时出错:', error.message);
  } finally {
    await sequelize.close();
  }
}

checkDatabaseStructure();