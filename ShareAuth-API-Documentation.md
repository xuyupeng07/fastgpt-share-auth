# ShareAuth API 接口文档

本文档详细介绍了 FastGPT 分享链接身份鉴权系统的三个核心接口：`init`、`start`、`finish`。这些接口用于实现用户身份验证、对话权限检查和消费记录管理。

## 目录

1. [接口概述](#接口概述)
2. [Init 接口 - 身份验证初始化](#init-接口---身份验证初始化)
3. [Start 接口 - 对话开始验证](#start-接口---对话开始验证)
4. [Finish 接口 - 对话结束处理](#finish-接口---对话结束处理)
5. [错误码说明](#错误码说明)
6. [调试日志说明](#调试日志说明)

## 接口概述

### 基础信息
- **基础URL**: `http://localhost:3000`
- **Content-Type**: `application/json`
- **认证方式**: JWT Token
- **字符编码**: UTF-8

### 接口调用流程
```
用户访问分享链接 → Init接口(身份验证) → Start接口(权限检查) → 对话进行 → Finish接口(消费记录)
```

---

## Init 接口 - 身份验证初始化

### 接口信息
- **URL**: `/shareAuth/init`
- **方法**: `POST`
- **功能**: 用户身份验证和JWT Token生成，同时获取用户访问链接并查询对应工作流的积分倍率
- **调用时机**: 用户首次访问分享链接时

### 新增功能特性
- **链接解析**: 自动获取用户访问的referer链接，提取no_login_url部分
- **工作流查询**: 根据no_login_url查询MongoDB中对应的工作流信息
- **积分倍率**: 返回工作流的point_multiplier积分倍率信息

### 请求参数

```json
{
  "username": "string (可选)",    // 用户名
  "password": "string (可选)",    // 密码
  "token": "string (可选)"        // JWT Token或明文Token
}
```

#### 参数说明
- 支持三种认证方式（按优先级）：
  1. **JWT Token验证**: 提供有效的JWT Token
  2. **用户名密码验证**: 提供username和password
  3. **明文Token验证**: 提供明文token（已弃用）

### 请求示例

#### 1. JWT Token验证
```bash
curl -X POST http://localhost:3000/shareAuth/init \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

#### 2. 用户名密码验证
```bash
curl -X POST http://localhost:3000/shareAuth/init \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "password123"
  }'
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "pointMultiplier": 2.5,
    "workflowInfo": {
      "id": "507f1f77bcf86cd799439012",
      "name": "智能客服工作流",
      "noLoginUrl": "https://cloud.fastgpt.io/chat/share?shareId=aWiVMYjiEToOjpOWzhIn3i1L"
    }
  }
}
```

#### 失败响应
```json
{
  "success": false,
  "message": "身份验证失败，无效的token"
}
```

### 终端日志示例

```
=== ShareAuth Init 接口调用 ===
时间: 2024/1/15 14:30:25
请求数据:
  Username: testuser
  Password: ***已提供***
  Token: 未提供
  完整请求体: {
    "username": "testuser",
    "password": "***"
  }

🔗 用户访问链接信息:
  Referer: https://cloud.fastgpt.io/chat/share?shareId=aWiVMYjiEToOjpOWzhIn3i1L&authToken=eyJhbGciOiJIUzI1NiIs...
  提取的no_login_url: https://cloud.fastgpt.io/chat/share?shareId=aWiVMYjiEToOjpOWzhIn3i1L
  工作流信息: 智能客服工作流 (ID: 507f1f77bcf86cd799439012)
  积分倍率: 2.5

👤 使用用户名密码验证...
  用户名: testuser
✅ 用户验证成功
  用户ID: 507f1f77bcf86cd799439011
  用户名: testuser
  用户余额: 100.50
  用户状态: active

🔑 生成JWT Token...
✅ JWT Token生成成功
  Token: eyJhbGciOiJIUzI1NiIs...

✅ === Init 处理成功 ===
响应数据: {
  "success": true,
  "authToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "userId": "507f1f77bcf86cd799439011",
    "username": "testuser",
    "pointMultiplier": 2.5,
    "workflowInfo": {
      "id": "507f1f77bcf86cd799439012",
      "name": "智能客服工作流",
      "noLoginUrl": "https://cloud.fastgpt.io/chat/share?shareId=aWiVMYjiEToOjpOWzhIn3i1L"
    }
  }
}
===================
```

---

## Start 接口 - 对话开始验证

### 接口信息
- **URL**: `/shareAuth/start`
- **方法**: `POST`
- **功能**: 验证用户权限、检查余额、过滤敏感词
- **调用时机**: 用户发起对话前

### 请求参数

```json
{
  "token": "string (必需)",        // JWT Token
  "question": "string (可选)",     // 用户问题
  "shareId": "string (可选)",      // 分享ID
  "appName": "string (推荐)"       // 工作流名称
}
```

#### 参数说明
- `token`: 从Init接口获取的JWT Token
- `question`: 用户提出的问题，用于敏感词检查
- `shareId`: 分享链接的唯一标识（可选）
- `appName`: 工作流名称，推荐传递以获取工作流配置信息

### 请求示例

```bash
curl -X POST http://localhost:3000/shareAuth/start \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "question": "你好，请介绍一下人工智能的发展历程",
    "shareId": "648aaf5ae121349a16d62192"
  }'
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "data": {
    "balance": 95.75
  }
}
```

#### 失败响应
```json
{
  "success": false,
  "message": "余额不足，请充值后再使用"
}
```

### 终端日志示例

```
=== ShareAuth Start 接口调用 ===
时间: 2024/1/15 14:32:10
请求数据:
  Token: eyJhbGciOiJIUzI1NiIs...
  Question: 你好，请介绍一下人工智能的发展历程
  ShareId: 648aaf5ae121349a16d62192
  完整请求体: {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "question": "你好，请介绍一下人工智能的发展历程",
    "shareId": "648aaf5ae121349a16d62192"
  }

🔐 验证JWT Token...
✅ JWT验证成功
  用户ID: 507f1f77bcf86cd799439011
  用户名: testuser

👤 获取用户详细信息...
✅ 用户信息获取成功
  用户ID: 507f1f77bcf86cd799439011
  用户名: testuser
  用户余额: 95.75
  用户状态: active

💰 检查用户余额...
  当前余额: 95.75
✅ 余额检查通过, 余额: 95.75

🔍 敏感词检查...
  检查内容: 你好，请介绍一下人工智能的发展历程
  敏感词列表: ["政治", "暴力", "色情", "赌博"]
✅ 敏感词检查通过

✅ === Start 处理成功 ===
用户可以开始对话
  用户: testuser
  问题: 你好，请介绍一下人工智能的发展历程
  当前余额: 95.75
响应数据: {
  "success": true,
  "data": {
    "balance": 95.75
  }
}
===================
```

---

## Finish 接口 - 对话结束处理

### 接口信息
- **URL**: `/shareAuth/finish`
- **方法**: `POST`
- **功能**: 处理对话消费、扣除余额、记录消费明细
- **调用时机**: 对话完成后

### 请求参数

```json
{
  "token": "string (必需)",           // JWT Token
  "workflowId": "string (可选)",      // 工作流ID（已弃用）
  "appName": "string (推荐)",         // 工作流名称，用于获取积分倍率和记录消费
  "responseData": "array (必需)"      // 对话响应数据
}
```

#### 重要说明
- **appName参数**: 强烈推荐传递此参数，用于：
  1. 获取工作流的积分倍率配置
  2. 在消费记录中正确显示工作流名称
  3. 如果不传递，消费记录中将显示"未知工作流"
- **workflowId参数**: 已弃用，建议使用appName替代

#### responseData 结构
```json
[
  {
    "moduleName": "core.module.template.Dataset search",
    "moduleType": "datasetSearchNode",
    "totalPoints": 1.5278,
    "query": "用户查询内容",
    "model": "Embedding-2",
    "tokens": 1524,
    "similarity": 0.83,
    "limit": 400,
    "searchMode": "embedding",
    "runningTime": 2.15
  }
]
```

### 请求示例

```bash
curl -X POST http://localhost:3000/shareAuth/finish \
  -H "Content-Type: application/json" \
  -d '{
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "appName": "智能客服工作流",
    "responseData": [
      {
        "moduleName": "AI对话模块",
        "moduleType": "chatNode",
        "totalPoints": 2.5,
        "tokens": 1200,
        "model": "GPT-3.5-turbo",
        "runningTime": 3.2
      }
    ]
  }'
```

### 响应格式

#### 成功响应
```json
{
  "success": true,
  "message": "消费记录已保存",
  "data": {
    "consumedAmount": 2.5,
    "remainingBalance": 93.25,
    "consumptionId": "507f1f77bcf86cd799439013"
  }
}
```

#### 失败响应
```json
{
  "success": false,
  "message": "余额不足，无法完成消费"
}
```

### 终端日志示例

```
=== ShareAuth Finish 接口调用 ===
时间: 2024/1/15 14:35:45
请求数据:
  Token: eyJhbGciOiJIUzI1NiIs...
  WorkflowId: 507f1f77bcf86cd799439012
  ResponseData: [
    {
      "moduleName": "AI对话模块",
      "moduleType": "chatNode",
      "totalPoints": 2.5,
      "tokens": 1200,
      "model": "GPT-3.5-turbo",
      "runningTime": 3.2
    }
  ]
  完整请求体: {...}

🔐 验证JWT Token...
✅ JWT验证成功, 用户ID: 507f1f77bcf86cd799439011

👤 获取用户信息...
✅ 用户信息获取成功
  用户ID: 507f1f77bcf86cd799439011
  用户名: testuser
  当前余额: 95.75

💰 计算消费数据...
  数据格式: Array
  使用body参数进行计算
  计算结果: 消费金额 = 2.5

🔍 查询工作流信息...
  工作流ID: 507f1f77bcf86cd799439012
✅ 工作流查询成功
  工作流名称: AI智能助手
  积分倍率: 1.2
  最终费用: 2.5 * 1.2 = 3.0

💾 开始MongoDB事务处理...
  当前用户余额: 95.75
  需要扣除金额: 3.0
  事务后余额: 92.75

✅ 余额扣除成功
  扣除金额: 3.0
  剩余余额: 92.75

✅ 消费记录写入成功
  记录ID: 507f1f77bcf86cd799439013
  消费金额: 3.0
  消费时间: 2024-01-15T06:35:45.123Z

✅ 用户信息更新成功
  更新后余额: 92.75

✅ === Finish 处理成功 ===
响应数据: {
  "success": true,
  "message": "消费记录已保存",
  "data": {
    "consumedAmount": 3.0,
    "remainingBalance": 92.75,
    "consumptionId": "507f1f77bcf86cd799439013"
  }
}
===================
```

---

## 错误码说明

### HTTP状态码
- `200`: 请求成功
- `400`: 请求参数错误
- `401`: 身份验证失败
- `402`: 余额不足
- `403`: 权限不足
- `404`: 资源不存在
- `500`: 服务器内部错误

### 业务错误码

| 错误信息 | 说明 | 解决方案 |
|---------|------|----------|
| 缺少token参数 | 请求中未提供token | 确保请求包含有效的token参数 |
| 身份验证失败，无效的token | JWT Token无效或过期 | 重新调用init接口获取新token |
| 用户名或密码错误 | 登录凭据不正确 | 检查用户名和密码是否正确 |
| 缺少认证参数 | 未提供任何认证信息 | 提供username+password或token |
| 用户不存在 | 数据库中找不到对应用户 | 检查用户ID是否正确 |
| 余额不足，请充值后再使用 | 用户余额为0或负数 | 用户需要充值 |
| 内容包含敏感词，请重新输入 | 问题包含敏感词汇 | 修改问题内容，避免敏感词 |
| 余额不足，无法完成消费 | 消费金额超过用户余额 | 用户需要充值或减少消费 |
| 服务器错误 | 系统内部错误 | 联系技术支持 |

---

## 调试日志说明

### 日志格式
所有接口都会在终端输出详细的调试日志，格式如下：

```
=== [接口名称] 接口调用 ===
时间: [调用时间]
请求数据: [请求参数详情]

[处理步骤1] [状态图标] [步骤描述]
  [详细信息]

[处理步骤2] [状态图标] [步骤描述]
  [详细信息]

[状态图标] === [接口名称] 处理[成功/失败] ===
响应数据: [响应内容]
===================
```

### 状态图标说明
- `🔐`: 身份验证相关
- `👤`: 用户信息相关
- `💰`: 余额相关
- `🔍`: 检查/验证相关
- `💾`: 数据库操作相关
- `✅`: 操作成功
- `❌`: 操作失败

### 日志级别
- **INFO**: 正常流程信息
- **SUCCESS**: 操作成功信息
- **ERROR**: 错误信息
- **DEBUG**: 调试详细信息

---

## 最佳实践

### 1. 错误处理
- 始终检查响应中的`success`字段
- 根据`message`字段提供用户友好的错误提示
- 实现重试机制处理网络错误

### 2. Token管理
- 安全存储JWT Token
- 实现Token自动刷新机制
- Token过期时重新调用init接口

### 3. 性能优化
- 合理设置请求超时时间
- 实现请求缓存机制
- 避免频繁调用接口

### 4. 安全考虑
- 使用HTTPS传输敏感数据
- 不在客户端存储明文密码
- 定期更新JWT密钥

---

## 联系支持

如果您在使用过程中遇到问题，请联系技术支持：
- 邮箱: support@example.com
- 文档更新时间: 2024年1月15日
- 版本: v1.0.0