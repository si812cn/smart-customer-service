// scripts/setup.js
const { execSync } = require('child_process');
const fs = require('fs');

console.log('🔧 正在安装项目依赖...');

try {
    // 检查 Node 版本
    const nodeVersion = process.version;
    if (!nodeVersion || !nodeVersion.startsWith('v16') && !nodeVersion.startsWith('v18') && !nodeVersion.startsWith('v20')) {
        console.warn('⚠️ 建议使用 Node.js 16+');
    }

    // 安装主项目依赖
    execSync('npm install', { stdio: 'inherit' });

    // 安装 dashboard 依赖
    if (fs.existsSync('dashboard')) {
        console.log('\n📦 安装 dashboard 依赖...');
        execSync('cd dashboard && npm install', { stdio: 'inherit' });
    }

    console.log('\n✅ 项目初始化完成！');
    console.log('\n🚀 开始开发:');
    console.log('   npm run dev');
    console.log('\n📦 打包发布:');
    console.log('   npm run build');
    console.log('\n📊 预览数据看板:');
    console.log('   npm run preview');
} catch (error) {
    console.error('❌ 安装失败:', error.message);
    process.exit(1);
}