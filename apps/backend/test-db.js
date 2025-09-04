const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'dbconn.sealoshzh.site',
  port: 33640,
  user: 'root',
  password: 'zkvmj7b8',
  database: 'noLogin'
};

async function testDatabaseConnection() {
  let connection;
  try {
    console.log('正在连接数据库...');
    console.log('连接配置:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database
    });
    
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功！');
    
    // 测试查询
    console.log('\n正在测试查询...');
    const [rows] = await connection.execute('SELECT 1 as test');
    console.log('✅ 查询测试成功:', rows);
    
    // 检查数据库表
    console.log('\n检查数据库表...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('数据库表列表:', tables);
    
    // 如果有users表，查询用户数据
    const hasUsersTable = tables.some(table => Object.values(table)[0] === 'users');
    if (hasUsersTable) {
      console.log('\n查询users表数据...');
      const [users] = await connection.execute('SELECT * FROM users LIMIT 5');
      console.log('用户数据:', users);
    } else {
      console.log('⚠️  未找到users表');
    }
    
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

testDatabaseConnection();