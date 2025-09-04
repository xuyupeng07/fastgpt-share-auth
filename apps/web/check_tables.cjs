const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'dbconn.sealoshzh.site',
  port: 33640,
  user: 'root',
  password: 'zkvmj7b8',
  database: 'noLogin'
};

async function checkTables() {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    console.log('数据库连接成功');
    
    // 查看所有表
    console.log('\n=== 数据库中的所有表 ===');
    const [tables] = await connection.execute('SHOW TABLES');
    tables.forEach(table => {
      console.log(Object.values(table)[0]);
    });
    
    // 查看users表结构
    console.log('\n=== users表结构 ===');
    const [usersDesc] = await connection.execute('DESCRIBE users');
    console.table(usersDesc);
    
    // 查看consumption_records表结构
    console.log('\n=== consumption_records表结构 ===');
    const [consumptionDesc] = await connection.execute('DESCRIBE consumption_records');
    console.table(consumptionDesc);
    
    // 查看recharge_records表结构
    console.log('\n=== recharge_records表结构 ===');
    const [rechargeDesc] = await connection.execute('DESCRIBE recharge_records');
    console.table(rechargeDesc);
    
  } catch (error) {
    console.error('错误:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

checkTables();