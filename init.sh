#!/bin/bash
# init.sh

echo "🚀 初始化智能客服系统"

# 检查 Node.js
if ! command -v node &> /dev/null; then
echo "❌ Node.js 未安装，请先安装 Node.js 16+"
exit 1
fi

# 检查 npm
if ! command -v npm &> /dev/null; then
echo "❌ npm 未安装"
exit 1
fi

# 安装依赖
echo "📦 安装主项目依赖..."
npm install

# 创建 dashboard 目录（如果不存在）
if [ ! -d "dashboard" ]; then
echo "📁 创建 dashboard 项目..."
mkdir -p dashboard/src
cd dashboard
npm init -y
npm install react react-dom antd recharts
npm install --save-dev vite @vitejs/plugin-react typescript
cd ..
fi

# 安装构建工具
npm install archiver rimraf --save-dev

# 运行 setup
node scripts/setup.js

echo "✅ 项目初始化完成！"
echo "👉 开始开发: npm run dev"
echo "👉 打包发布: npm run build"