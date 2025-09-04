const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// 数据库配置 - 使用test项目的数据库参数
const dbConfig = {
  host: 'dbconn.sealoshzh.site',
  port: 33640,
  user: 'root',
  password: 'zkvmj7b8',
  database: 'noLogin'
};

// 中间件
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 数据库连接池
const pool = mysql.createPool({
  ...dbConfig,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// 根据token查找用户
async function findUserByToken(token) {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE token = ?', [token]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('查询用户失败:', error);
    return null;
  }
}

// 根据用户名和密码验证用户
async function authenticateUser(username, password) {
  try {
    const [rows] = await pool.execute('SELECT * FROM users WHERE username = ? AND password = ?', [username, password]);
    return rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('用户验证失败:', error);
    return null;
  }
}

// 1. 聊天初始化校验接口（登录接口）
app.post('/shareAuth/init', async (req, res) => {
  console.log('收到登录请求:', req.body);
  
  const { username, password, token } = req.body;
  
  let user = null;
  
  // 如果有token参数，使用token验证（FastGPT云端调用）
  if (token) {
    user = await findUserByToken(token);
    if (!user) {
      return res.json({
        success: false,
        message: '身份验证失败，无效的token'
      });
    }
    console.log(`Token验证成功: ${user.username}`);
  }
  // 否则使用用户名密码验证（登录页面调用）
  else if (username && password) {
    user = await authenticateUser(username, password);
    if (!user) {
      return res.json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    console.log(`用户 ${user.username} 登录成功`);
  }
  // 两种参数都没有
  else {
    return res.json({
      success: false,
      message: '缺少认证参数'
    });
  }
  
  res.json({
    success: true,
    authToken: user.token,
    data: {
      uid: user.uid,
      username: user.username
    }
  });
});

// 2. 对话前校验接口
app.post('/shareAuth/start', async (req, res) => {
  console.log('收到对话开始请求:', req.body);
  
  const { token, question } = req.body;
  
  if (!token) {
    return res.json({
      success: false,
      message: '缺少token参数'
    });
  }
  
  const user = await findUserByToken(token);
  
  if (!user) {
    return res.json({
      success: false,
      message: '身份验证失败，无效的token'
    });
  }
  
  // 检查用户余额
  if (user.balance <= 0) {
    return res.json({
      success: false,
      message: '余额不足，请充值后再使用'
    });
  }
  
  // 简单的内容审核 - 检查敏感词
  const sensitiveWords = ['违法', '暴力', '色情', '政治'];
  if (question && sensitiveWords.some(word => question.includes(word))) {
    return res.json({
      success: false,
      message: '内容包含敏感词，请重新输入'
    });
  }
  
  console.log(`用户 ${user.username} 开始对话: ${question}, 当前余额: ${user.balance}`);
  
  res.json({
    success: true,
    data: {
      uid: user.uid,
      balance: user.balance
    }
  });
});

// 3. 对话结果上报接口（可选）
app.post('/shareAuth/finish', async (req, res) => {
  console.log('收到对话结束上报:', { token: req.body.token });
  
  const { token, responseData } = req.body;
  
  if (!token) {
    return res.json({
      success: false,
      message: '缺少token参数'
    });
  }
  
  const user = await findUserByToken(token);
  
  if (!user) {
    return res.json({
      success: false,
      message: '身份验证失败，无效的token'
    });
  }
  
  // 计算总消耗（支持FastGPT格式）
  let totalPoints = 0;
  let totalTokens = 0;
  
  if (responseData) {
    if (Array.isArray(responseData)) {
      // 数组格式
      totalPoints = responseData.reduce((sum, item) => sum + (item.totalPoints || 0), 0);
      totalTokens = responseData.reduce((sum, item) => {
        const inputTokens = item.inputTokens || 0;
        const outputTokens = item.outputTokens || 0;
        const tokens = item.tokens || 0;
        return sum + inputTokens + outputTokens + tokens;
      }, 0);
    } else if (responseData.usage) {
      // FastGPT格式：{usage: {totalTokens: xxx, totalPoints: xxx}}
      totalTokens = responseData.usage.totalTokens || 0;
      totalPoints = responseData.usage.totalPoints || 0;
    } else {
      // 直接对象格式
      totalTokens = responseData.totalTokens || responseData.tokens || 0;
      totalPoints = responseData.totalPoints || responseData.points || 0;
    }
  }
  
  // 计算费用 - 消耗积分直接等于总费用
  const totalCost = totalPoints;
  
  console.log(`用户 ${user.username} 对话结束 - 消耗积分: ${totalPoints}, 消耗Token: ${totalTokens}, 总费用: ${totalCost.toFixed(4)}积分`);
  
  try {
    // 开始数据库事务
    const connection = await pool.getConnection();
    await connection.beginTransaction();
    
    try {
      // 扣除用户余额
      await connection.execute(
        'UPDATE users SET balance = balance - ? WHERE id = ?',
        [totalCost, user.id]
      );
      
      // 记录消费记录 - 确保保存完整的response_data和username字段
      await connection.execute(
        'INSERT INTO consumption_records (user_id, username, token_used, points_used, cost, response_data) VALUES (?, ?, ?, ?, ?, ?)',
        [user.id, user.username, totalTokens, totalPoints, totalCost, responseData ? JSON.stringify(responseData) : null]
      );
      
      // 提交事务
      await connection.commit();
      connection.release();
      
      // 获取更新后的余额
      const [updatedUser] = await pool.execute('SELECT balance FROM users WHERE id = ?', [user.id]);
      const newBalance = updatedUser[0]?.balance || 0;
      
      console.log(`用户 ${user.username} 余额扣除成功，剩余余额: ${newBalance}`);
      
      res.json({
        success: true,
        message: '上报成功',
        data: {
          cost: totalCost,
          balance: newBalance,
          tokens: totalTokens,
          points: totalPoints
        }
      });
      
    } catch (error) {
      // 回滚事务
      await connection.rollback();
      connection.release();
      throw error;
    }
    
  } catch (error) {
    console.error('处理消费记录失败:', error);
    res.json({
      success: false,
      message: '处理消费记录失败'
    });
  }
});

// 获取用户列表（用于演示）
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT username, token, uid, email, balance, created_at FROM users');
    res.json({
      success: true,
      users: rows
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.json({
      success: false,
      message: '获取用户列表失败'
    });
  }
});

// 获取配置信息
app.get('/api/config', (req, res) => {
  res.json({
    success: true,
    config: {
      shareId: 'demo_share_id',
      appName: 'FastGPT',
      description: '欢迎回来，请登录您的账户'
    }
  });
});

// 保存配置信息
app.post('/api/config', (req, res) => {
  const { shareId, appName, description } = req.body;
  
  // 这里可以将配置保存到数据库或文件
  console.log('保存配置:', { shareId, appName, description });
  
  res.json({
    success: true,
    message: '配置保存成功'
  });
});

// 查询用户余额
app.get('/api/balance/:token', async (req, res) => {
  const { token } = req.params;
  
  const user = await findUserByToken(token);
  if (!user) {
    return res.json({
      success: false,
      message: '无效的token'
    });
  }
  
  res.json({
    success: true,
    data: {
      username: user.username,
      balance: user.balance,
      uid: user.uid
    }
  });
});

// 用户充值
app.post('/api/recharge', async (req, res) => {
  const { token, amount } = req.body;
  
  if (!token || !amount || amount <= 0) {
    return res.json({
      success: false,
      message: '参数错误'
    });
  }
  
  const user = await findUserByToken(token);
  if (!user) {
    return res.json({
      success: false,
      message: '无效的token'
    });
  }
  
  try {
    await pool.execute(
      'UPDATE users SET balance = balance + ? WHERE id = ?',
      [amount, user.id]
    );
    
    const [updatedUser] = await pool.execute('SELECT balance FROM users WHERE id = ?', [user.id]);
    const newBalance = updatedUser[0]?.balance || 0;
    
    console.log(`用户 ${user.username} 充值成功，充值积分: ${amount}, 新余额: ${newBalance}`);
    
    res.json({
      success: true,
      message: '充值成功',
      data: {
        balance: parseFloat(newBalance),
        rechargeAmount: parseFloat(amount)
      }
    });
  } catch (error) {
    console.error('充值失败:', error);
    res.json({
      success: false,
      message: '充值失败'
    });
  }
});

// 获取所有消费记录（管理员接口）
app.get('/api/consumption/all', async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  
  try {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const limitNum = parseInt(limit);
    
    const [records] = await pool.execute(
      `SELECT id, username, token_used, points_used, cost, created_at FROM consumption_records ORDER BY created_at DESC LIMIT ${offset}, ${limitNum}`
    );
    
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM consumption_records'
    );
    
    res.json({
      success: true,
      data: {
        records,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取所有消费记录失败:', error);
    res.json({
      success: false,
      message: '获取所有消费记录失败'
    });
  }
});

// 获取消费记录
app.get('/api/consumption/:token', async (req, res) => {
  const { token } = req.params;
  const { page = 1, limit = 10 } = req.query;
  
  const user = await findUserByToken(token);
  if (!user) {
    return res.json({
      success: false,
      message: '无效的token'
    });
  }
  
  try {
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const [records] = await pool.execute(
      'SELECT id, token_used, points_used, cost, created_at FROM consumption_records WHERE user_id = ? ORDER BY created_at DESC LIMIT ?, ?',
      [user.id, offset, parseInt(limit)]
    );
    
    const [countResult] = await pool.execute(
      'SELECT COUNT(*) as total FROM consumption_records WHERE user_id = ?',
      [user.id]
    );
    
    res.json({
      success: true,
      data: {
        records,
        total: countResult[0].total,
        page: parseInt(page),
        limit: parseInt(limit)
      }
    });
  } catch (error) {
    console.error('获取消费记录失败:', error);
    res.json({
      success: false,
      message: '获取消费记录失败'
    });
  }
});

// 获取消费记录详情（包含聊天记录）
app.get('/api/consumption/detail/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.json({
        success: false,
        message: '缺少记录ID参数'
      });
    }
    
    // 获取消费记录详情
    const [records] = await pool.execute(
      'SELECT id, username, token_used, points_used, cost, response_data, created_at FROM consumption_records WHERE id = ?',
      [id]
    );
    
    if (records.length === 0) {
      return res.json({
        success: false,
        message: '记录不存在'
      });
    }
    
    const record = records[0];
    
    // 解析聊天历史
    let chatHistory = [];
    if (record.response_data) {
      try {
        let responseData;
        // 如果已经是对象，直接使用；如果是字符串，则解析
        if (typeof record.response_data === 'object') {
          responseData = record.response_data;
        } else {
          responseData = JSON.parse(record.response_data);
        }
        
        if (Array.isArray(responseData)) {
          // 查找包含聊天历史的节点
          for (const item of responseData) {
            if (item.historyPreview && Array.isArray(item.historyPreview)) {
              chatHistory = item.historyPreview;
              break;
            }
          }
        }
      } catch (parseError) {
        console.error('解析聊天历史失败:', parseError);
      }
    }
    
    res.json({
      success: true,
      data: {
        id: record.id,
        username: record.username,
        token_used: record.token_used,
        points_used: record.points_used,
        cost: record.cost,
        chat_history: chatHistory,
        created_at: record.created_at
      }
    });
    
  } catch (error) {
    console.error('获取消费记录详情失败:', error);
    res.json({
      success: false,
      message: '获取消费记录详情失败'
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`\n🚀 FastGPT登录服务器启动成功！`);
  console.log(`📍 服务地址: http://localhost:${PORT}`);
  console.log(`🔗 API接口: http://localhost:${PORT}/api`);

  console.log(`\n=== 核心接口 ===`);
  console.log(`POST /shareAuth/init - 登录验证`);
  console.log(`POST /shareAuth/start - 对话前校验`);
  console.log(`POST /shareAuth/finish - 对话结果上报`);
  console.log(`==================\n`);
});