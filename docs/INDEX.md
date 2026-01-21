# 📚 文档中心

本文档中心包含了Doit任务管理应用的所有相关文档。

## 📖 文档列表

### 🚀 快速开始
- **README.md** - 项目主文档,包含功能介绍、使用方法和快速开始指南

### 🔧 技术文档
- **docs/INSTALLATION.md** - 详细的安装指南,支持桌面应用和浏览器版

### 📦 便携版本
- **docs/PORTABLE_GUIDE.md** - macOS免安装版使用指南
  - 无需Apple开发者签名
  - 解压即用
  - 包含Gatekeeper问题解决方案

### 🎯 功能说明
- **docs/QUICK_REFERENCE.md** - 快速参考手册,包含常用操作和快捷键

### 🔒 安全和权限
- **docs/GATEKEEPER_EXPLAINED.md** - macOS Gatekeeper隔离机制详解
  - 解释为什么会出现"已损坏"提示
  - 提供多种解决方案

### 🛠️ 开发记录
- **docs/OPTIMIZATION_REPORT.md** - 性能优化报告
  - 打包体积优化
  - 启动速度优化
  - 资源加载优化

### 🐛 问题修复
- **docs/EXPORT_FIX_SUMMARY.md** - 数据导出功能修复说明
- **docs/BUGFIX_OVERDUE_REMINDER.md** - 逾期提醒功能修复说明
  - 已完成任务不再触发逾期提醒
  - 每张卡片每天最多提醒一次

### 🇨🇳 中文文档
- **docs/优化方案总结.md** - 项目优化方案的中文总结
- **docs/使用说明卡片.md** - 用户使用说明卡片

## 📂 文档结构

```
Doit/
├── README.md                    # 项目主文档
├── docs/                        # 文档目录
│   ├── INSTALLATION.md          # 安装指南
│   ├── PORTABLE_GUIDE.md        # 便携版指南
│   ├── QUICK_REFERENCE.md       # 快速参考
│   ├── GATEKEEPER_EXPLAINED.md  # Gatekeeper说明
│   ├── OPTIMIZATION_REPORT.md   # 优化报告
│   ├── EXPORT_FIX_SUMMARY.md    # 导出修复说明
│   ├── BUGFIX_OVERDUE_REMINDER.md # 逾期提醒修复
│   ├── 优化方案总结.md          # 优化方案(中文)
│   └── 使用说明卡片.md          # 使用卡片(中文)
```

## 🔍 按场景查找文档

### 新用户
1. 先阅读 **README.md** 了解项目
2. 根据需求选择安装方式:
   - Mac用户查看 **docs/PORTABLE_GUIDE.md** (推荐) 或 **docs/INSTALLATION.md**
   - Windows用户查看 **docs/INSTALLATION.md**

### Mac用户遇到"已损坏"提示
1. 查看简版解决方案: **docs/PORTABLE_GUIDE.md**
2. 查看详细技术说明: **docs/GATEKEEPER_EXPLAINED.md**

### 开发者
1. 查看开发说明: README.md 中的"开发说明"章节
2. 查看优化记录: **docs/OPTIMIZATION_REPORT.md**
3. 查看问题修复记录:
   - **docs/EXPORT_FIX_SUMMARY.md**
   - **docs/BUGFIX_OVERDUE_REMINDER.md**

### 技术支持
1. 快速查阅: **docs/QUICK_REFERENCE.md**
2. 查看中文说明: **docs/使用说明卡片.md**

## 📝 文档更新记录

### 2026-01-13
- ✨ 创建文档中心
- 📂 整理所有文档到 `docs/` 目录
- 🧹 删除测试和调试文件
- 📝 添加文档索引

### 2026-01-13
- ✨ 添加逾期提醒修复文档
- 🐛 修复已完成任务仍触发逾期提醒的问题
- 🐛 限制逾期提醒频率为每天一次

### 2026-01-13
- ✨ 添加便携版使用指南
- 🚀 添加免安装版自动打包功能
- 🔧 优化打包流程

### 2026-01-07
- ✨ 添加数据导出修复文档
- 🐛 修复导出文件找不到的问题

### 2024
- ✨ 初始文档创建

---

**提示**: 所有文档都在持续更新中,如有疑问请查阅相关文档或提交Issue。
