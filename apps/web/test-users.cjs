const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'dbconn.sealoshzh.site',
  user: 'root',
  password: 'zkvmj7b8',
  database: 'noLogin',
  port: 33640,
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000
};

async function testUsers() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 查询所有用户
    const [users] = await connection.execute('SELECT * FROM users');
    console.log('用户数据:');
    console.log(JSON.stringify(users, null, 2));
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

testUsers();