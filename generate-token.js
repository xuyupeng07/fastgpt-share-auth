const jwt = require('jsonwebtoken');
const { getUserByUsername } = require('./apps/web/lib/db');

async function generateValidToken() {
  try {
    // 使用项目中的JWT密钥
    const JWT_SECRET = 'fastgpt-secure-secret-key-2024';
    
    // 查找一个真实用户
    const user = await getUserByUsername('admin'); // 尝试查找admin用户
    
    if (!user) {
      console.log('未找到admin用户，使用测试数据');
      // 如果没有找到用户，创建一个测试token
      const testPayload = {
        userId: '676b7b8b8b8b8b8b8b8b8b8b',
        username: 'testuser',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1小时后过期
      };
      
      const token = jwt.sign(testPayload, JWT_SECRET);
      console.log('测试Token:', token);
      return token;
    }
    
    // 使用真实用户数据创建token
    const payload = {
      userId: user._id.toString(),
      username: user.username,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (60 * 60) // 1小时后过期
    };
    
    const token = jwt.sign(payload, JWT_SECRET);
    console.log('用户信息:', { userId: user._id.toString(), username: user.username, balance: user.balance });
    console.log('生成的Token:', token);
    
    return token;
  } catch (error) {
    console.error('生成token失败:', error);
    return null;
  }
}

generateValidToken().then(() => {
  process.exit(0);
}).catch(error => {
  console.error('执行失败:', error);
  process.exit(1);
});