# 脚本工具目录

本目录包含项目开发和运维过程中使用的各种辅助脚本。

## 脚本列表

### 1. generate-admin-password.js
**用途**：生成管理员账号的bcrypt密码哈希值

**使用方法**：
```bash
node scripts/generate-admin-password.js
```

**输出**：
- 密码哈希值
- 可直接在MySQL中执行的SQL语句

**说明**：
- 默认密码为 `Admin@123456`
- 如需修改，编辑脚本中的 `PASSWORD` 常量
- 每次运行生成的哈希值都不同（salt随机）

---

## 添加新脚本的规范

1. **文件命名**：使用小写字母和连字符，如 `create-xxx.js`
2. **文件头部**：必须包含详细的注释说明
   - 脚本用途
   - 使用方法
   - 参数说明（如有）
   - 注意事项
3. **环境检查**：脚本应检查运行环境是否正确
4. **错误处理**：提供清晰的错误提示
5. **输出格式**：使用emoji和分隔线使输出更清晰

### 脚本模板

```javascript
/**
 * 脚本名称
 * 
 * 用途：
 * 1. 功能描述1
 * 2. 功能描述2
 * 
 * 使用方法：
 * node scripts/脚本文件名.js [参数]
 * 
 * 注意：
 * - 注意事项1
 * - 注意事项2
 */

// 依赖引入
const xxx = require('xxx');

// 配置常量
const CONFIG = {
  // 配置项
};

// 主函数
async function main() {
  try {
    // 业务逻辑
    console.log('执行成功');
  } catch (error) {
    console.error('执行失败:', error.message);
    process.exit(1);
  }
}

// 环境检查
function checkEnvironment() {
  // 检查逻辑
}

// 执行
checkEnvironment();
main();
```

---

## 常用脚本示例

### 数据库相关
- 初始化测试数据
- 清理过期数据
- 数据迁移

### 运维相关
- 备份数据库
- 清理日志文件
- 生成报告

### 开发相关
- 生成密码哈希
- 创建测试账号
- 批量数据处理
