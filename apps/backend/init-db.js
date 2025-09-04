const mysql = require('mysql2/promise');

// 数据库配置
const dbConfig = {
  host: 'dbconn.sealoshzh.site',
  port: 33640,
  user: 'root',
  password: 'zkvmj7b8',
  database: 'noLogin'
};

async function initDatabase() {
  let connection;
  try {
    console.log('正在连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    console.log('✅ 数据库连接成功！');
    
    // 创建用户表
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        token VARCHAR(255) UNIQUE NOT NULL,
        uid VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100),
        balance DECIMAL(10,2) DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `;
    
    await connection.execute(createUsersTable);
    console.log('✅ users表创建/检查完成');
    
    // 创建消费记录表
    const createConsumptionTable = `
      CREATE TABLE IF NOT EXISTS consumption_records (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        username VARCHAR(50) NOT NULL,
        token_used INT DEFAULT 0,
        points_used DECIMAL(10,4) DEFAULT 0,
        cost DECIMAL(10,4) NOT NULL,
        response_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id)
      )
    `;
    
    await connection.execute(createConsumptionTable);
    console.log('✅ consumption_records表创建/检查完成');
    
    // 检查并添加缺失的字段
    try {
      await connection.execute('ALTER TABLE consumption_records ADD COLUMN IF NOT EXISTS username VARCHAR(50)');
      await connection.execute('ALTER TABLE consumption_records ADD COLUMN IF NOT EXISTS token_used INT DEFAULT 0');
      await connection.execute('ALTER TABLE consumption_records ADD COLUMN IF NOT EXISTS response_data JSON');
      await connection.execute('ALTER TABLE consumption_records DROP COLUMN IF EXISTS token');
      await connection.execute('ALTER TABLE consumption_records DROP COLUMN IF EXISTS tokens_used');
      await connection.execute('ALTER TABLE consumption_records DROP COLUMN IF EXISTS question');
      await connection.execute('ALTER TABLE consumption_records DROP COLUMN IF EXISTS response');
      console.log('✅ consumption_records表字段更新完成');
    } catch (alterError) {
      console.log('字段更新跳过（可能已存在）:', alterError.message);
    }
    
    // 检查是否有测试用户数据
    const [users] = await connection.execute('SELECT COUNT(*) as count FROM users');
    if (users[0].count === 0) {
      console.log('\n正在插入测试用户数据...');
      
      const insertUsers = `
        INSERT INTO users (username, password, token, uid, email, balance) VALUES
        ('demo_user1', '123456', 'fastgpt_token_001', 'user_001', 'demo1@example.com', 250.00),
        ('demo_user2', '123456', 'fastgpt_token_002', 'user_002', 'demo2@example.com', 250.00),
        ('demo_user3', '123456', 'fastgpt_token_003', 'user_003', 'demo3@example.com', 250.00),
        ('admin', '123456', 'fastgpt_admin_token', 'admin_001', 'admin@example.com', 1000.00)
      `;
      
      await connection.execute(insertUsers);
      console.log('✅ 测试用户数据插入完成');
    } else {
      console.log(`\n数据库中已有 ${users[0].count} 个用户`);
    }
    
    // 显示当前用户列表
    console.log('\n当前用户列表:');
    const [userList] = await connection.execute('SELECT username, token, balance FROM users');
    console.table(userList);
    
    console.log('\n🎉 数据库初始化完成！');
    
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n数据库连接已关闭');
    }
  }
}

initDatabase();