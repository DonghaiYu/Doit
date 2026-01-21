#!/bin/bash
#
# Doit 便携版启动脚本
# 使用方法: 解压 zip 文件后,双击此脚本即可启动应用
#

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PATH="$SCRIPT_DIR/Doit.app"

# 检查应用是否存在
if [ ! -d "$APP_PATH" ]; then
    osascript -e 'display dialog "未找到 Doit.app 应用! 请确保此脚本与 Doit.app 在同一目录下。" buttons {"确定"} default button "确定" with title "错误" with icon stop'
    exit 1
fi

# 自动移除隔离属性(解决 Gatekeeper 问题)
xattr -cr "$APP_PATH" 2>/dev/null

# 检查应用是否已损坏
if codesign -v "$APP_PATH" 2>&1 | grep -q "code object is not signed"; then
    echo "应用签名验证中..."
fi

# 启动应用
open "$APP_PATH"

# 显示成功提示(可选)
# osascript -e 'display notification "Doit 正在启动..." with title "Doit 任务管理器"'
