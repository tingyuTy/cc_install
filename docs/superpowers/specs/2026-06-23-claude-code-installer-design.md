# Claude Code Installer — Design Spec

**Date**: 2026-06-23  
**Status**: Approved  
**Summary**: 一个基于 Electron 的跨平台桌面应用，通过分步向导帮助用户一键安装 Claude Code，支持 macOS 和 Windows，特别优化中国大陆网络环境下的安装体验。

---

## 1. 目标

- 为普通用户（非开发者）提供简单的一键安装 Claude Code 的图形化工具
- 支持 macOS 和 Windows 双平台
- 使用 pnpm 安装 Claude Code（兼容中国大陆网络环境）
- 自动检测并安装缺失的 Node.js / pnpm 环境
- 安装完成后支持自定义配置 DeepSeek V4 模型

---

## 2. 技术栈

| 层 | 技术 | 说明 |
|---|------|------|
| 框架 | Electron | 跨平台桌面应用 |
| 主进程语言 | TypeScript | 系统操作、IPC |
| 渲染进程 | 原生 HTML/CSS/JS | 足够简单，不需要前端框架 |
| 打包 | electron-builder | 同时输出安装包 (.dmg/.exe) 和便携包 (.zip) |
| 包管理 | pnpm | 统一使用 pnpm |

---

## 3. 项目结构

```
cc_install/
├── package.json
├── electron-builder.yml        # 打包配置
├── src/
│   ├── main/                   # Electron 主进程
│   │   ├── index.ts            # 入口，窗口管理
│   │   ├── ipc-handlers.ts     # IPC 通道注册
│   │   ├── logger.ts           # 全局日志系统
│   │   ├── modules/
│   │   │   ├── env-check.ts    # 环境检测 (node, pnpm)
│   │   │   ├── node-install.ts # Node.js 下载安装
│   │   │   ├── pnpm-install.ts # pnpm 安装
│   │   │   ├── cc-install.ts   # Claude Code 安装
│   │   │   └── config-gen.ts   # DeepSeek 配置生成
│   │   └── utils/
│   │       ├── download.ts     # 下载工具（进度回调）
│   │       ├── platform.ts     # 平台检测
│   │       └── shell.ts        # 子进程封装（跨平台）
│   ├── renderer/               # 渲染进程
│   │   ├── index.html          # 主页面
│   │   ├── style.css           # 样式
│   │   ├── app.js              # Wizard 状态管理
│   │   └── steps/
│   │       ├── step1-check.js  # 环境检测页
│   │       ├── step2-node.js   # Node.js 安装页
│   │       ├── step3-pnpm.js   # pnpm 安装页
│   │       ├── step4-cc.js     # Claude Code 安装页
│   │       └── step5-config.js # 模型配置页
│   └── preload/
│       └── index.ts            # contextBridge 暴露 API
├── assets/
│   └── icon.png
└── scripts/
    └── build.ts                # 构建脚本
```

---

## 4. Wizard 流程（5 步）

### Step 1: 环境检测
- 执行 `node -v` / `pnpm -v` 检测环境
- 绿色 ✓ 表示已有，红色 ✗ 表示缺失
- 不可跳过

### Step 2: 安装 Node.js
- 若 Step 1 检测到已有，自动跳过
- 从 `https://nodejs.org/dist/latest/` 获取最新版本号
- 拼接下载链接：`node-v{version}-{darwin|win}-x64.{pkg|msi}`
- macOS: `sudo installer -pkg node.pkg -target /`
- Windows: `msiexec /i node.msi /quiet`
- 安装后执行 `node -v` 验证
- 可重试

### Step 3: 安装 pnpm
- 若 Step 1 检测到已有，自动跳过
- 执行 `npm install -g pnpm`
- 安装后执行 `pnpm -v` 验证
- 可重试

### Step 4: 安装 Claude Code
- 执行 `pnpm install -g @anthropic-ai/claude-code`
- 安装后执行 `claude --version` 验证
- 不可跳过，可重试

### Step 5: 配置 DeepSeek V4
- 用户输入 DeepSeek API Key
- 可选输入自定义 Base URL（默认 `https://api.deepseek.com`）
- 生成 `~/.claude.json` 配置文件
- 可手动跳过（用户日后自行配置）

---

## 5. 全局日志系统

界面底部有一个可折叠的日志面板，贯穿所有步骤。

**特性**：
- Main 进程维护全局日志缓冲区（数组）
- 每条日志带 `[HH:MM:SS]` 时间戳
- 实时通过 IPC 推送到渲染进程
- 日志内容包括：检测结果、下载链接、执行的完整命令、stdout/stderr、错误详情、最终结果
- 点击"导出日志"按钮 → 系统保存对话框 → 导出为 `.txt` 文件

**日志示例**：
```
[10:23:01] 检测到系统: darwin
[10:23:01] Node.js 未安装
[10:23:02] 开始下载 Node.js...
[10:23:02] 下载地址: https://nodejs.org/dist/latest/node-v20.11.0-darwin-x64.pkg
[10:23:45] 下载完成 (58 MB)
[10:23:46] 执行安装命令: sudo installer -pkg /tmp/node-v20.11.0-darwin-x64.pkg -target /
[10:24:10] Node.js v20.11.0 安装成功 ✓
```

---

## 6. IPC 通信设计

**Renderer → Main（调用）**：
```typescript
window.api.checkEnv()              // → { node: string|null, pnpm: string|null, platform: string }
window.api.installNode()           // → void（进度通过事件推送）
window.api.installPnpm()           // → void
window.api.installClaudeCode()     // → void
window.api.generateConfig({ apiKey, baseUrl? }) // → { success: boolean }
window.api.exportLogs()            // → 弹出保存对话框
```

**Main → Renderer（事件推送）**：
```typescript
onProgress({ step, percent, message })
onLog({ timestamp, text })
onError({ step, error, retryable, skippable })
```

---

## 7. 跨平台适配

| 差异点 | macOS | Windows |
|--------|-------|---------|
| 安装包格式 | `.pkg` | `.msi` |
| 静默安装 | `sudo installer -pkg ... -target /` | `msiexec /i ... /quiet` |
| Node 默认路径 | `/usr/local/bin/node` | `C:\Program Files\nodejs\node.exe` |
| Shell | `/bin/zsh` or `/bin/bash` | `cmd.exe` or `powershell.exe` |
| PATH 刷新 | 自动生效 | 需刷新环境变量 |

- `platform.ts` 封装平台检测和差异逻辑
- `shell.ts` 封装子进程执行，对外暴露统一接口
- 文件路径统一使用 `os.homedir()`、`os.tmpdir()`

---

## 8. 错误处理

| 级别 | 场景 | 行为 |
|------|------|------|
| 可重试 | 下载超时、网络断开 | 错误信息 + 重试按钮（最多 3 次，间隔递增 3s/6s/12s） |
| 可跳过 | Node/pnpm 安装失败 | 警告 + 继续按钮 |
| 阻断 | CC 安装失败、权限不足 | 错误详情 + 修复建议 |

**特殊场景**：
- 权限不足 → macOS 弹密码框，Windows 提示管理员运行
- 磁盘空间不足 → 安装前检查（预留 500MB）
- 用户中途关闭 → 弹窗确认"安装未完成，确定退出？"
- 已有旧版本 CC → 提示覆盖/升级

---

## 9. 打包与分发

使用 `electron-builder` 同时输出：

| 平台 | 安装包 | 便携包 |
|------|--------|--------|
| macOS | `.dmg` | `.zip` (解压即用) |
| Windows | `.exe` (NSIS 安装程序) | `.zip` (解压即用) |

---

## 10. 不在第一版范围内的内容

- 其他模型提供商（如 OpenAI、通义千问等）—— 后续版本支持
- Linux 支持 —— 后续版本考虑
- 自动更新功能 —— 后续版本
- 配置多模型切换 —— 后续版本
