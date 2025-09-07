import { execSync } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 设置环境变量（如果需要的话）
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// 执行迁移脚本
try {
  console.log('开始执行数据迁移...');
  
  // 使用ts-node执行TypeScript文件
  const scriptPath = path.join(__dirname, 'migrate-mysql-to-mongodb.ts');
  
  execSync(`npx ts-node ${scriptPath}`, {
    stdio: 'inherit',
    cwd: process.cwd()
  });
  
  console.log('数据迁移执行完成！');
} catch (error) {
  console.error('数据迁移执行失败:', error.message);
  process.exit(1);
}