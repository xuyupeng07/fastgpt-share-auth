/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  // FastGPT 链接配置已迁移到数据库管理
  
  // 允许开发环境跨域请求
  allowedDevOrigins: [
    'mkgoehdqkjpk.sealoshzh.site',
    '*.sealoshzh.site'
  ],
}

export default nextConfig
