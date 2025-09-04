const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'dbconn.sealoshzh.site',
  port: 33640,
  user: 'root',
  password: 'zkvmj7b8',
  database: 'noLogin'
};

async function addUserStatusField() {
  let connection;
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功！');
    
    // 检查status字段是否已存在
    console.log('\n检查status字段是否存在...');
    const [columns] = await connection.execute(
      "SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'noLogin' AND TABLE_NAME = 'users' AND COLUMN_NAME = 'status'"
    );
    
    if (columns.length > 0) {
      console.log('⚠️  status字段已存在，跳过添加');
    } else {
      // 添加status字段
      console.log('正在添加status字段...');
      await connection.execute(
        'ALTER TABLE users ADD COLUMN status ENUM(\'active\', \'inactive\') DEFAULT \'active\' AFTER balance'
      );
      console.log('✅ status字段添加成功');
      
      // 将现有用户的状态设置为active
      console.log('正在更新现有用户状态...');
      const [result] = await connection.execute(
        "UPDATE users SET status = 'active' WHERE status IS NULL"
      );
      console.log(`✅ 已更新 ${result.affectedRows} 个用户的状态为active`);
    }
    
    // 显示更新后的表结构
    console.log('\n当前users表结构:');
    const [tableStructure] = await connection.execute('DESCRIBE users');
    console.table(tableStructure);
    
    // 显示用户列表
    console.log('\n当前用户列表:');
    const [users] = await connection.execute('SELECT id, username, balance, status FROM users');
    console.table(users);
    
    console.log('\n🎉 用户状态字段添加完成！');
    
  } catch (error) {
    console.error('❌ 添加用户状态字段失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

addUserStatusField();