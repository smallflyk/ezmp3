/** @type {import('next').NextConfig} */
const nextConfig = {
  // 禁用 ESLint 和 TypeScript 检查
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  // 使用独立输出模式
  output: 'standalone',
};

module.exports = nextConfig; 