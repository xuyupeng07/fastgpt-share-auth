import mysql from 'mysql2/promise';

// 数据库配置
const dbConfig = {
  host: 'dbconn.sealoshzh.site',
  port: 33640,
  user: 'root',
  password: 'zkvmj7b8',
  database: 'noLogin'
};

// 创建数据库连接池
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 导出pool供其他模块使用
export { pool };

// 根据token查找用户
export async function findUserByToken(token: string) {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE token = ?', [token]);
    return (rows as any[]).length > 0 ? (rows as any[])[0] : null;
  } catch (error) {
    console.error('查询用户失败:', error);
    return null;
  }
}

// 根据用户名和密码验证用户
export async function authenticateUser(username: string, password: string) {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    return (rows as any[]).length > 0 ? (rows as any[])[0] : null;
  } catch (error) {
    console.error('用户验证失败:', error);
    return null;
  }
}

// 获取所有用户
export async function getAllUsers() {
  try {
    const [rows] = await pool.execute('SELECT id, username, token, uid, email, balance, status, created_at FROM users ORDER BY created_at DESC');
    return rows;
  } catch (error) {
    console.error('获取用户列表失败:', error);
    return [];
  }
}

// 更新用户状态
export async function updateUserStatus(userId: number, status: 'active' | 'inactive') {
  try {
    const [result] = await pool.execute(
      'UPDATE users SET status = ? WHERE id = ?',
      [status, userId]
    );
    return result;
  } catch (error) {
    console.error('更新用户状态失败:', error);
    throw error;
  }
}

// 更新用户余额
export async function updateUserBalance(token: string, newBalance: number) {
  try {
    await pool.execute('UPDATE users SET balance = ?, updated_at = NOW() WHERE token = ?', [newBalance, token]);
    return true;
  } catch (error) {
    console.error('更新用户余额失败:', error);
    return false;
  }
}

// 添加消费记录
export async function addConsumptionRecord(userId: number, username: string, tokenUsed: number, pointsUsed: number, cost: number, responseData?: any) {
  try {
    await pool.execute(
      'INSERT INTO consumption_records (user_id, username, token_used, points_used, cost, response_data) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, username, tokenUsed, pointsUsed, cost, responseData ? JSON.stringify(responseData) : null]
    );
    return true;
  } catch (error) {
    console.error('添加消费记录失败:', error);
    return false;
  }
}

// 获取所有消费记录
export async function getAllConsumptionRecords() {
  try {
    const [rows] = await pool.execute(`
      SELECT cr.*, u.username 
      FROM consumption_records cr 
      LEFT JOIN users u ON cr.user_id = u.id 
      ORDER BY cr.created_at DESC
    `);
    return rows;
  } catch (error) {
    console.error('获取消费记录失败:', error);
    return [];
  }
}

// 获取用户消费记录
export async function getUserConsumptionRecords(token: string) {
  try {
    const [rows] = await pool.execute(`
      SELECT cr.*, u.username 
      FROM consumption_records cr 
      LEFT JOIN users u ON cr.user_id = u.id 
      WHERE cr.token = ? 
      ORDER BY cr.created_at DESC
    `, [token]);
    return rows;
  } catch (error) {
    console.error('获取用户消费记录失败:', error);
    return [];
  }
}

// 获取消费记录详情
export async function getConsumptionRecordDetail(id: number) {
  try {
    const [rows] = await pool.execute(`
      SELECT cr.id, cr.user_id, cr.token_used, cr.points_used, cr.cost, cr.response_data, cr.created_at, u.username, u.email 
      FROM consumption_records cr 
      LEFT JOIN users u ON cr.user_id = u.id 
      WHERE cr.id = ?
    `, [id]);
    return (rows as any[]).length > 0 ? (rows as any[])[0] : null;
  } catch (error) {
    console.error('获取消费记录详情失败:', error);
    return null;
  }
}

// 添加充值记录
export async function addRechargeRecord(userId: number, username: string, token: string, amount: number, balanceBefore: number, balanceAfter: number, remark?: string) {
  try {
    await pool.execute(
      'INSERT INTO recharge_records (user_id, username, token, amount, balance_before, balance_after, remark) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [userId, username, token, amount, balanceBefore, balanceAfter, remark || '']
    );
    return true;
  } catch (error) {
    console.error('添加充值记录失败:', error);
    return false;
  }
}

// 获取所有充值记录
export async function getAllRechargeRecords() {
  try {
    const [rows] = await pool.execute(`
      SELECT rr.*, u.username 
      FROM recharge_records rr 
      LEFT JOIN users u ON rr.user_id = u.id 
      ORDER BY rr.created_at DESC
    `);
    return rows;
  } catch (error) {
    console.error('获取充值记录失败:', error);
    return [];
  }
}

// 根据token获取充值记录
export async function getRechargeRecordsByToken(token: string) {
  try {
    const [rows] = await pool.execute(`
      SELECT rr.*, u.username 
      FROM recharge_records rr 
      LEFT JOIN users u ON rr.user_id = u.id 
      WHERE rr.token = ? 
      ORDER BY rr.created_at DESC
    `, [token]);
    return rows;
  } catch (error) {
    console.error('获取用户充值记录失败:', error);
    return [];
  }
}

export default pool;