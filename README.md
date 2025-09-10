# FastGPT 分享链接身份鉴权系统

一个基于 Next.js 和 MongoDB 的分享链接身份鉴权系统，支持 JWT Token 验证和用户管理功能。

## 🌟 项目特性

- 🔐 JWT Token 身份验证
- 👥 用户注册和登录系统
- 🔗 分享链接管理
- 🎨 现代化 UI 设计（基于 shadcn/ui）
- 📱 响应式设计
- 🚀 基于 Next.js 15 和 React 19
- 💾 MongoDB 数据库支持
- 🎯 TypeScript 全栈开发

## 🛠️ 技术栈

- **前端**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **UI 组件**: shadcn/ui, Radix UI, Framer Motion
- **后端**: Next.js API Routes, JWT
- **数据库**: MongoDB, Mongoose
- **开发工具**: Turbo, ESLint, Prettier
- **包管理**: pnpm

## 📦 项目结构

```
fastgpt-share-auth/
├── apps/
│   └── web/                 # Next.js 主应用
│       ├── src/
│       │   ├── app/         # App Router 页面
│       │   ├── components/  # 组件
│       │   └── lib/         # 工具库
│       └── package.json
├── packages/
│   ├── ui/                  # 共享 UI 组件库
│   ├── eslint-config/       # ESLint 配置
│   └── typescript-config/   # TypeScript 配置
├── package.json
└── turbo.json
```

## 🚀 快速开始

### 环境要求

- Node.js >= 20
- pnpm >= 10.4.1
- MongoDB 数据库

### 安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd fastgpt-share-auth

# 安装依赖
pnpm install
```

### 环境配置

创建 `.env.local` 文件并配置以下环境变量：

```env
# MongoDB 连接配置
MONGODB_URI=mongodb://username:password@host:port/database?directConnection=true&authSource=admin

# JWT 配置
JWT_SECRET=your-jwt-secret-key-here

# 其他配置
NEXT_PUBLIC_API_URL=http://localhost:3000
NODE_ENV=development
```

### 启动开发服务器

```bash
# 开发模式（推荐）
pnpm run dev

# 或使用启动脚本
./entrypoint.sh
```

服务器将在 http://localhost:3000 启动，支持热更新。

### 生产环境部署

```bash
# 构建项目
pnpm run build

# 启动生产服务器
pnpm run start

# 或使用启动脚本
./entrypoint.sh production
```

## 🌐 在线预览

项目已部署到线上环境，可以通过以下地址访问：

**🔗 预览地址**: [https://hxtgqbueaqlc.sealoshzh.site](https://hxtgqbueaqlc.sealoshzh.site)

## 📚 功能说明

### 用户认证
- 用户注册和登录
- JWT Token 生成和验证
- 密码加密存储
- 会话管理

### 分享链接管理
- 创建分享链接
- 链接权限控制
- 访问统计
- 链接过期管理

### UI 组件
- 基于 shadcn/ui 的现代化组件
- 深色/浅色主题切换
- 响应式布局
- 动画效果

## 🛠️ 开发指南

### 添加 UI 组件

```bash
# 在 web 应用中添加 shadcn/ui 组件
pnpm dlx shadcn@latest add button -c apps/web
```

### 使用组件

```tsx
import { Button } from "@workspace/ui/components/button"

export default function MyComponent() {
  return <Button>点击我</Button>
}
```

### 代码规范

```bash
# 代码检查
pnpm run lint

# 代码格式化
pnpm run format

# 类型检查
pnpm run typecheck
```

## 📝 数据库脚本

项目包含以下数据库相关脚本：

- `generate-token.js` - JWT Token 生成工具
- `test-db-status.js` - 数据库连接测试
- `test-finish.js` - 测试完成脚本

使用 Node.js 执行：

```bash
node generate-token.js
node test-db-status.js
```

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 打开 Pull Request

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情。

## 📞 联系方式

- 项目作者: 许
- 项目邮箱: 943471751@qq.com

如有问题或建议，请通过以下方式联系：

- 项目地址: [GitHub Repository](https://github.com/xuyupeng07/fastgpt-share-auth)
- 在线预览: [https://hxtgqbueaqlc.sealoshzh.site](https://hxtgqbueaqlc.sealoshzh.site)

---

⭐ 如果这个项目对你有帮助，请给它一个 Star！
