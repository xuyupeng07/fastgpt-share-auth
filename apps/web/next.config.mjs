/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/ui"],
  env: {
    NEXT_PUBLIC_FASTGPT_SHARE_URL: process.env.FASTGPT_SHARE_URL,
  },
}

export default nextConfig
