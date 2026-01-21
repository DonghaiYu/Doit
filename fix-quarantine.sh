#!/bin/bash
#
# Doit 隔离属性移除脚本
# 用于自动移除 macOS 的 Quarantine 隔离属性
#

APP_PATH="/Applications/Doit.app"

# 检查应用是否存在
if [ ! -d "$APP_PATH" ]; then
    echo "❌ 未找到 Doit.app 应用"
    echo "请先运行安装程序,或手动将 Doit.app 拖入应用程序文件夹"
    exit 1
fi

echo "🔧 正在移除隔离属性..."
xattr -cr "$APP_PATH"

if [ $? -eq 0 ]; then
    echo "✅ 隔离属性已成功移除!"
    echo "现在可以正常打开 Doit.app 了"
else
    echo "❌ 移除失败,请检查权限"
    exit 1
fi

echo ""
echo "提示: 如果仍然无法打开,请尝试:"
echo "1. 右键点击 Doit.app → 选择'打开'"
echo "2. 在弹出的对话框中点击'打开'按钮"
