// scripts/build-zip.js
const fs = require('fs');
const path = require('path');
const archiver = require('archiver');

// 确保依赖
try {
    require.resolve('archiver');
} catch (e) {
    console.error('请先安装 archiver: npm install archiver --save-dev');
    process.exit(1);
}

const output = fs.createWriteStream('smart-customer-service.zip');
const archive = archiver('zip', { zlib: { level: 9 } });

output.on('close', () => {
    console.log(`✅ 构建完成: smart-customer-service.zip (${archive.pointer()} bytes)`);
});

archive.on('error', (err) => {
    throw err;
});

archive.pipe(output);

// 添加核心文件
archive.file('manifest.json', { name: 'manifest.json' });
archive.file('dist/main.js', { name: 'main.js' });

// 添加 dashboard（可选）
if (fs.existsSync('dashboard/dist')) {
    const dashboardFiles = walkDir('dashboard/dist');
    dashboardFiles.forEach(file => {
        const relative = path.relative('dashboard/dist', file);
        archive.file(file, { name: `dashboard/${relative}` });
    });
}

// 添加图标（可选）
const icons = ['icon16.png', 'icon48.png', 'icon128.png'];
icons.forEach(icon => {
    if (fs.existsSync(icon)) {
        archive.file(icon, { name: icon });
    }
});

// 打包
archive.finalize();
console.log('📦 正在打包插件...');

/**
 * 递归遍历目录
 */
function walkDir(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(file => {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);
        if (stat && stat.isDirectory()) {
            results = results.concat(walkDir(fullPath));
        } else {
            results.push(fullPath);
        }
    });
    return results;
}