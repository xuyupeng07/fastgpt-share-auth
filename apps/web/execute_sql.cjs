const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

async function executeSQLFile() {
  let connection;
  try {
    // 数据库连接配置
    connection = await mysql.createConnection({
      host: 'dbconn.sealoshzh.site',
      port: 33640,
      user: 'root',
      password: 'zkvmj7b8',
      database: 'noLogin'
    });

    console.log('数据库连接成功');

    // 读取SQL文件
    const sqlFile = path.join(__dirname, 'create_workflows_table.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    // 执行SQL
    await connection.execute(sql);
    console.log('工作流表创建成功');

  } catch (error) {
    console.error('执行SQL时出错:', error);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

executeSQLFile();