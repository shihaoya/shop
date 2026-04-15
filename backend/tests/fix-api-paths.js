const fs = require('fs');
const path = require('path');

const testDir = __dirname;
const files = ['products.test.js', 'points.test.js', 'users.test.js'];

files.forEach(file => {
  const filePath = path.join(testDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 替换所有 /api/operator/ 为 /api/v1/operator/
  content = content.replace(/'\/api\/operator\//g, "'/api/v1/operator/");
  
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✅ 已更新 ${file}`);
});

console.log('所有测试文件API路径已更新');
