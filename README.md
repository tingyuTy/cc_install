# Claude Code Installer

一键安装 [Claude Code](https://claude.ai/code) 的跨平台桌面工具。通过分步向导帮助用户自动检测环境、安装 Node.js / pnpm，并通过 pnpm 安装 Claude Code。支持 macOS 和 Windows。

---

## 功能

- **环境检测** — 自动检查 Node.js 和 pnpm 是否已安装
- **一键安装 Node.js** — 从 Node.js 官方源下载并静默安装
- **安装 pnpm** — 通过 npm 全局安装 pnpm
- **安装 Claude Code** — 通过 pnpm 全局安装 `@anthropic-ai/claude-code`
- **配置 DeepSeek** — 安装完成后生成 DeepSeek V4 模型配置
- **全流程日志** — 每个操作均有实时日志，支持导出

## 技术栈

- **框架**: Electron
- **语言**: TypeScript（主进程）+ 原生 HTML/CSS/JS（渲染进程）
- **测试**: Vitest
- **打包**: electron-builder

## 安装依赖

```bash
# 中国大陆网络环境（推荐）
ELECTRON_MIRROR="https://npmmirror.com/mirrors/electron/" pnpm install

# 其他国家/地区
pnpm install
```

## 开发

```bash
# 运行测试
pnpm test

# 启动应用
pnpm dev
```

## 构建

```bash
pnpm build
```

macOS / Windows 通用，构建脚本会自动检测平台。

构建产物输出到 `release/` 目录：

| 平台 | 安装包 | 便携包 |
|------|--------|--------|
| macOS | `.dmg` | `.zip` |
| Windows | `.exe` (NSIS) | `.zip` |

## 使用方式

1. 运行应用，进入 **环境检测** 页面
2. 根据检测结果，自动或手动安装 Node.js / pnpm
3. 安装 Claude Code
4. 输入 DeepSeek API Key，生成配置文件

## 项目结构

```
src/
├── main/                 # Electron 主进程 (TypeScript)
│   ├── index.ts          # 窗口管理 + 应用生命周期
│   ├── ipc-handlers.ts   # IPC 通道注册
│   ├── logger.ts         # 全局日志系统
│   ├── modules/
│   │   ├── env-check.ts  # node / pnpm 环境检测
│   │   ├── node-install.ts   # Node.js 下载安装
│   │   ├── pnpm-install.ts   # pnpm 安装
│   │   ├── cc-install.ts     # Claude Code 安装
│   │   └── config-gen.ts     # 模型配置生成
│   └── utils/
│       ├── platform.ts   # 平台检测 + 安装命令
│       ├── shell.ts      # 子进程执行封装
│       └── download.ts   # 下载（含重试 + 进度）
├── preload/index.ts      # contextBridge API
└── renderer/             # 渲染进程 (HTML/CSS/JS)
    ├── index.html
    ├── style.css
    ├── app.js            # 向导状态机
    └── steps/            # 5 个步骤页面
```

## License

MIT
