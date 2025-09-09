import jwt from 'jsonwebtoken';

function generateValidToken() {
  // 使用项目中的JWT密钥和配置
  const JWT_SECRET = 'fastgpt-secure-secret-key-2024';
  const JWT_ISSUER = 'fastgpt-auth';
  const JWT_AUDIENCE = 'fastgpt-share';
  
  // 生成唯一的jti
  const jti = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // 创建测试token
  const testPayload = {
    userId: '68bf7f325e9398be88df2a50',
    username: 'testuser',
    jti: jti
  };
  
  const token = jwt.sign(testPayload, JWT_SECRET, {
    issuer: JWT_ISSUER,
    audience: JWT_AUDIENCE,
    expiresIn: '1h'
  });
  console.log('生成的Token:', token);
  return token;
}

const token = generateValidToken();
console.log('\n使用此token测试finish接口:');
console.log(token);