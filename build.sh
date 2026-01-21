#!/bin/bash

# Doit 应用一键构建脚本
# 自动构建所有平台和版本

set -e  # 遇到错误立即退出

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 打印带颜色的消息
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_header() {
    echo ""
    echo -e "${GREEN}========================================${NC}"
    echo -e "${GREEN}  $1${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo ""
}

# 检查 Node.js 和 npm
check_dependencies() {
    print_info "检查依赖..."

    if ! command -v node &> /dev/null; then
        echo "❌ Node.js 未安装，请先安装 Node.js"
        exit 1
    fi

    if ! command -v npm &> /dev/null; then
        echo "❌ npm 未安装，请先安装 npm"
        exit 1
    fi

    print_success "依赖检查完成"
}

# 安装依赖
install_dependencies() {
    if [ ! -d "node_modules" ]; then
        print_info "安装依赖..."
        npm install
        print_success "依赖安装完成"
    fi
}

# 构建函数
build_version() {
    local version=$1

    case $version in
        mac)
            print_header "构建 macOS 正式版"
            npm run build:mac
            print_success "macOS 正式版构建完成"
            ;;

        mac-portable)
            print_header "构建 macOS 免安装版"
            npm run build:mac-portable
            print_success "macOS 免安装版构建完成"
            ;;

        win)
            print_header "构建 Windows 版本"
            npm run build:win
            print_success "Windows 版本构建完成"
            ;;

        all)
            print_header "构建所有版本"
            npm run build
            npm run build:mac-portable
            print_success "所有版本构建完成"
            ;;

        *)
            echo "❌ 未知版本: $version"
            echo "支持的版本: mac, mac-portable, win, all"
            exit 1
            ;;
    esac
}

# 显示构建结果
show_results() {
    print_header "构建结果"

    echo "📁 dist 目录内容:"
    echo ""

    if [ -d "dist" ]; then
        ls -lh dist/*.zip dist/*.dmg 2>/dev/null | awk '{print "  " $9 " (" $5 ")"}'

        echo ""
        echo "📊 文件说明:"
        echo "  - Doit-1.3.0-portable-mac.zip  → macOS 免安装版 (推荐)"
        echo "  - Doit-1.3.0-arm64.dmg         → macOS 正式安装版"
        echo "  - Doit-1.3.0-arm64-mac.zip     → macOS ZIP 版本"
        echo "  - Doit-1.3.0-win.exe           → Windows 安装版"
        echo ""
    fi
}

# 主函数
main() {
    print_header "Doit 应用构建工具 v1.0"

    # 解析命令行参数
    local build_type="mac-portable"  # 默认构建免安装版

    if [ $# -gt 0 ]; then
        build_type=$1
    fi

    # 显示使用说明
    if [ "$build_type" = "help" ] || [ "$build_type" = "--help" ]; then
        echo "使用方法: bash build.sh [版本]"
        echo ""
        echo "可选版本:"
        echo "  mac           - 构建 macOS 正式版 (DMG + ZIP)"
        echo "  mac-portable - 构建 macOS 免安装版 (默认)"
        echo "  win           - 构建 Windows 版本"
        echo "  all           - 构建所有版本"
        echo ""
        echo "示例:"
        echo "  bash build.sh          # 构建 macOS 免安装版"
        echo "  bash build.sh mac      # 构建 macOS 正式版"
        echo "  bash build.sh all      # 构建所有版本"
        echo ""
        exit 0
    fi

    # 执行构建流程
    check_dependencies
    install_dependencies
    build_version "$build_type"
    show_results

    print_success "构建流程完成! 🎉"
}

# 运行主函数
main "$@"
