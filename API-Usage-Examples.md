# ShareAuth API 使用示例

本文档提供了 ShareAuth API 的完整使用示例，展示如何正确调用各个接口，特别是如何传递 `appName` 参数以确保工作流名称正确显示。

## 完整调用流程示例

### 1. Init 接口调用

```javascript
// 初始化身份验证
const initResponse = await fetch('http://localhost:3000/shareAuth/init', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'testuser',
    password: 'password123'
  })
});

const initData = await initResponse.json();
const authToken = initData.authToken;
```

### 2. Start 接口调用（推荐传递 appName）

```javascript
// 开始对话验证
const startResponse = await fetch('http://localhost:3000/shareAuth/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: authToken,
    question: '你好，请介绍一下人工智能',
    shareId: 'aWiVMYjiEToOjpOWzhIn3i1L',
    appName: '智能客服工作流'  // 重要：传递工作流名称
  })
});

const startData = await startResponse.json();
```

### 3. Finish 接口调用（必须传递 appName）

```javascript
// 对话结束处理
const finishResponse = await fetch('http://localhost:3000/shareAuth/finish', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    token: authToken,
    appName: '智能客服工作流',  // 重要：传递工作流名称
    responseData: [
      {
        moduleName: 'AI对话模块',
        moduleType: 'chatNode',
        totalPoints: 2.5,
        tokens: 1200,
        model: 'GPT-3.5-turbo',
        runningTime: 3.2
      }
    ]
  })
});

const finishData = await finishResponse.json();
```

## FastGPT 集成示例

如果您是 FastGPT 的开发者，需要集成 ShareAuth 服务，请确保在调用时传递正确的 `appName` 参数：

```javascript
// FastGPT 中的集成示例
class ShareAuthClient {
  constructor(baseUrl, appName) {
    this.baseUrl = baseUrl;
    this.appName = appName;  // 工作流名称
    this.authToken = null;
  }

  async init(credentials) {
    const response = await fetch(`${this.baseUrl}/shareAuth/init`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });
    const data = await response.json();
    this.authToken = data.authToken;
    return data;
  }

  async start(question, shareId) {
    return await fetch(`${this.baseUrl}/shareAuth/start`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: this.authToken,
        question,
        shareId,
        appName: this.appName  // 确保传递工作流名称
      })
    });
  }

  async finish(responseData) {
    return await fetch(`${this.baseUrl}/shareAuth/finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: this.authToken,
        appName: this.appName,  // 确保传递工作流名称
        responseData
      })
    });
  }
}

// 使用示例
const authClient = new ShareAuthClient('http://localhost:3000', '智能客服工作流');

// 初始化
await authClient.init({ username: 'user', password: 'pass' });

// 开始对话
await authClient.start('你好', 'shareId123');

// 结束对话
await authClient.finish([{ moduleName: 'AI模块', totalPoints: 1.5 }]);
```

## 重要提醒

### 为什么需要传递 appName？

1. **正确显示工作流名称**: 如果不传递 `appName`，消费记录中会显示"未知工作流"
2. **获取积分倍率**: `appName` 用于查询工作流的积分倍率配置
3. **准确计费**: 不同工作流可能有不同的计费标准

### 常见问题

**Q: 我的消费记录显示"未知工作流"怎么办？**
A: 请确保在调用 `finish` 接口时传递了正确的 `appName` 参数。

**Q: appName 应该传递什么值？**
A: 传递您在 MongoDB 中配置的工作流名称，确保与数据库中的 `name` 字段完全匹配。

**Q: 不传递 appName 会影响功能吗？**
A: 基本功能不受影响，但会使用默认积分倍率(1.0)，且消费记录中无法正确显示工作流名称。

## 测试命令

```bash
# 测试 finish 接口（包含 appName）
curl -X POST http://localhost:3000/shareAuth/finish \
  -H "Content-Type: application/json" \
  -d '{
    "token": "your-jwt-token",
    "appName": "智能客服工作流",
    "responseData": [{
      "moduleName": "测试模块",
      "moduleType": "testNode",
      "totalPoints": 1.0
    }]
  }'
```