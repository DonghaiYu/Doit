#!/usr/bin/env node

/**
 * Doit 免安装版自动打包脚本
 * 功能: 将构建的 zip 文件解压,添加启动脚本,重新打包
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 读取 package.json 获取版本号
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// 构建输出目录
const distDir = path.join(__dirname, '..', 'dist');
const portableDir = path.join(distDir, `Doit-${version}-portable-mac`);
const appDir = path.join(distDir, 'mac-arm64', 'Doit.app');

console.log(`📦 开始创建 Doit ${version} 免安装版...`);

try {
  // 创建临时目录
  if (fs.existsSync(portableDir)) {
    execSync(`rm -rf "${portableDir}"`);
  }
  fs.mkdirSync(portableDir, { recursive: true });

  // 复制应用包
  console.log('📋 复制应用包...');
  execSync(`cp -R "${appDir}" "${portableDir}/"`);

  // 复制启动脚本
  console.log('📝 添加启动脚本...');
  execSync(`cp launch-mac.sh "${portableDir}/"`);
  execSync(`cp fix-quarantine.sh "${portableDir}/"`);
  execSync(`chmod +x "${portableDir}/launch-mac.sh"`);
  execSync(`chmod +x "${portableDir}/fix-quarantine.sh"`);

  // 复制使用说明
  if (fs.existsSync('PORTABLE_GUIDE.md')) {
    execSync(`cp PORTABLE_GUIDE.md "${portableDir}/使用说明.md"`);
  }

  // 复制 README
  if (fs.existsSync('README.md')) {
    execSync(`cp README.md "${portableDir}/"`);
  }

  // 打包成 zip
  console.log('🗜️  正在打包成 zip...');
  const zipName = `Doit-${version}-portable-mac.zip`;
  const zipPath = path.join(distDir, zipName);

  // 删除旧的免安装包
  if (fs.existsSync(zipPath)) {
    fs.unlinkSync(zipPath);
  }

  // 使用 ditto 创建 zip (macOS 原生命令,支持扩展属性)
  execSync(`cd "${distDir}" && ditto -c -k --keepParent "Doit-${version}-portable-mac" "${zipName}"`);

  // 设置 zip 文件的可执行权限
  execSync(`chmod 644 "${zipPath}"`);

  // 清理临时目录
  execSync(`rm -rf "${portableDir}"`);

  // 计算文件大小
  const stats = fs.statSync(zipPath);
  const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

  console.log('');
  console.log('✅ 免安装版创建完成!');
  console.log('');
  console.log(`📁 文件位置: ${distDir}/${zipName}`);
  console.log(`📦 文件大小: ${sizeMB} MB`);
  console.log('');
  console.log('📤 使用方法:');
  console.log('   1. 将 zip 文件发送给其他 Mac 用户');
  console.log('   2. 用户解压 zip 文件');
  console.log('   3. 双击 launch-mac.sh 即可启动应用');
  console.log('   4. 无需安装,无需任何命令行操作');
  console.log('');

} catch (error) {
  console.error('❌ 创建免安装版失败:', error.message);
  process.exit(1);
}
