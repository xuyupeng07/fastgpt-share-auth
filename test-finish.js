const jwt = require('jsonwebtoken');
const { exec } = require('child_process');

// 使用项目中的JWT密钥
const JWT_SECRET = 'fastgpt-secure-secret-key-2024';

// 生成测试token
const token = jwt.sign({
  userId: '676b7b8b8b8b8b8b8b8b8b8b',
  username: 'testuser'
}, JWT_SECRET, { expiresIn: '1h' });

console.log('Generated token:', token);

// 测试数据
const testData = {
  token: token,
  responseData: {
    usage: {
      totalTokens: 100,
      totalPoints: 0.05
    }
  }
};

// 使用curl测试finish接口
const curlCommand = `curl -X POST http://localhost:3000/api/shareAuth/finish \
  -H "Content-Type: application/json" \
  -d '${JSON.stringify(testData)}' \
  -w "\n\nHTTP Status: %{http_code}\n"`;

console.log('\nTesting finish API...');
console.log('Command:', curlCommand);

exec(curlCommand, (error, stdout, stderr) => {
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('\nResponse:');
  console.log(stdout);
  
  if (stderr) {
    console.error('Stderr:', stderr);
  }
});