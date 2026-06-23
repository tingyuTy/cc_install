# Claude Code Installer 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个基于 Electron 的跨平台桌面应用，通过分步向导帮助用户一键安装 Claude Code，支持 macOS / Windows。

**Architecture:** Electron 主进程（TypeScript）处理所有系统操作，渲染进程（原生 HTML/CSS/JS）展示分步向导 UI。主进程模块采用 TDD 开发，每个模块独立可测。IPC 通过 preload contextBridge 安全通信。

**Tech Stack:** Electron, TypeScript, vitest (测试), electron-builder (打包)

## Global Constraints

- 平台支持: macOS + Windows
- 安装方式: pnpm install -g @anthropic-ai/claude-code
- Node.js 来源: https://nodejs.org/dist/latest/ 官方源
- 配置输出: ~/.claude.json
- 分发格式: .dmg + .exe (NSIS) + .zip (便携)
- 版本锁定: 无版本锁定要求

---

### Task 1: Project Scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `electron-builder.yml`
- Create: `vitest.config.ts`
- Create: `.gitignore`
- Create: `scripts/build.ts`

**Interfaces:**
- Consumes: (none)
- Produces: 项目可 `pnpm install && pnpm dev` 启动空白 Electron 窗口

---

- [ ] **Step 1: Write package.json**

```json
{
  "name": "cc-installer",
  "version": "1.0.0",
  "description": "一键安装 Claude Code 的跨平台桌面工具",
  "main": "dist/main/index.js",
  "scripts": {
    "dev": "tsc && electron .",
    "build": "tsc && electron-builder",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "electron": "^33.0.0",
    "electron-builder": "^25.0.0",
    "typescript": "^5.6.0",
    "vitest": "^2.0.0",
    "@types/node": "^22.0.0"
  }
}
```

- [ ] **Step 2: Write tsconfig.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/renderer"]
}
```

- [ ] **Step 3: Write electron-builder.yml**

```yaml
appId: com.ccinstaller.app
productName: Claude Code Installer
directories:
  output: release
  buildResources: assets

mac:
  target:
    - dmg
    - zip
  artifactName: cc-installer-${version}-mac.${ext}
  icon: assets/icon.png

win:
  target:
    - nsis
    - zip
  artifactName: cc-installer-${version}-win.${ext}
  icon: assets/icon.png

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true

files:
  - dist/**/*
  - assets/**/*
  - package.json
```

- [ ] **Step 4: Write vitest.config.ts**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
  },
});
```

- [ ] **Step 5: Write .gitignore**

```
node_modules/
dist/
release/
*.dmg
*.exe
*.zip
.DS_Store
```

- [ ] **Step 6: Write scripts/build.ts** (placeholder, completed in Task 14)

```typescript
// Placeholder — 在 Task 14 中完善
console.log('Build script — see Task 14');
```

- [ ] **Step 7: Verify scaffolding**

Run: `pnpm install`
Expected: Dependencies installed, no errors.

Run: `pnpm test`
Expected: "No test files found" (非错误 exit code 1 是可接受的初始状态)

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json electron-builder.yml vitest.config.ts .gitignore scripts/build.ts pnpm-lock.yaml
git commit -m "chore: project scaffolding with Electron + TypeScript + vitest"
```

---

### Task 2: Global Logger Module

**Files:**
- Create: `src/main/logger.ts`
- Create: `src/main/logger.test.ts`

**Interfaces:**
- Consumes: (none)
- Produces:
  - `export class GlobalLogger` — 全局单例
    - `log(text: string): void`
    - `getLogs(): LogEntry[]`
    - `exportToString(): string`
    - `onLogEntry(callback: (entry: LogEntry) => void): void`
    - `clear(): void`
  - `export interface LogEntry { timestamp: string; text: string }`

---

- [ ] **Step 1: Write failing test for logger**

Create `src/main/logger.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { GlobalLogger } from './logger';

describe('GlobalLogger', () => {
  let logger: GlobalLogger;

  beforeEach(() => {
    logger = new GlobalLogger();
  });

  it('should add a log entry with timestamp', () => {
    logger.log('检测到系统: darwin');
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].text).toBe('检测到系统: darwin');
    expect(logs[0].timestamp).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('should maintain log order', () => {
    logger.log('第一条日志');
    logger.log('第二条日志');
    logger.log('第三条日志');
    const logs = logger.getLogs();
    expect(logs).toHaveLength(3);
    expect(logs[0].text).toBe('第一条日志');
    expect(logs[2].text).toBe('第三条日志');
  });

  it('should export logs as formatted string', () => {
    logger.log('test message');
    const exported = logger.exportToString();
    expect(exported).toContain('test message');
    expect(exported).toMatch(/^\[\d{2}:\d{2}:\d{2}\] test message$/m);
  });

  it('should call onLogEntry callback for each log', () => {
    const entries: string[] = [];
    logger.onLogEntry((entry) => entries.push(entry.text));
    logger.log('first');
    logger.log('second');
    expect(entries).toEqual(['first', 'second']);
  });

  it('should clear all logs', () => {
    logger.log('some log');
    logger.clear();
    expect(logger.getLogs()).toHaveLength(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/logger.test.ts`
Expected: FAIL — `Cannot find module './logger'`

- [ ] **Step 3: Write minimal logger implementation**

Create `src/main/logger.ts`:

```typescript
export interface LogEntry {
  timestamp: string;
  text: string;
}

export class GlobalLogger {
  private logs: LogEntry[] = [];
  private listeners: Array<(entry: LogEntry) => void> = [];

  log(text: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toTimeString().slice(0, 8),
      text,
    };
    this.logs.push(entry);
    this.listeners.forEach((cb) => cb(entry));
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  exportToString(): string {
    return this.logs
      .map((entry) => `[${entry.timestamp}] ${entry.text}`)
      .join('\n');
  }

  onLogEntry(callback: (entry: LogEntry) => void): void {
    this.listeners.push(callback);
  }

  clear(): void {
    this.logs = [];
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/logger.test.ts`
Expected: 5 tests PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/logger.ts src/main/logger.test.ts
git commit -m "feat: add GlobalLogger with timestamp, export, and event support"
```

---

### Task 3: Platform + Shell Utils

**Files:**
- Create: `src/main/utils/platform.ts`
- Create: `src/main/utils/platform.test.ts`
- Create: `src/main/utils/shell.ts`
- Create: `src/main/utils/shell.test.ts`

**Interfaces:**
- Consumes: GlobalLogger from Task 2
- Produces:
  - `getPlatform(): 'darwin' | 'win32'`
  - `getNodeDownloadUrl(version: string): string`
  - `getNodeInstallCommand(pkgPath: string): { cmd: string; args: string[]; useSudo: boolean }`
  - `getDefaultShell(): string`
  - `runCommand(cmd: string, args: string[], opts?: { cwd?: string }): Promise<{ stdout: string; stderr: string; exitCode: number }>`
  - `createRunCommand(): (cmd: string, args: string[], opts?: { cwd?: string }) => Promise<{ stdout: string; stderr: string; exitCode: number }>`

---

- [ ] **Step 1: Write failing test for platform utils**

Create `src/main/utils/platform.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { getNodeInstallCommand, getNodeDownloadUrl, getPlatform } from './platform';

describe('platform utils', () => {
  describe('getPlatform', () => {
    it('should return darwin or win32', () => {
      const platform = getPlatform();
      expect(['darwin', 'win32']).toContain(platform);
    });
  });

  describe('getNodeDownloadUrl', () => {
    it('should generate macOS download URL', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const url = getNodeDownloadUrl('v20.11.0');
      expect(url).toBe('https://nodejs.org/dist/v20.11.0/node-v20.11.0-darwin-x64.pkg');
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should generate Windows download URL', async () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const url = getNodeDownloadUrl('v20.11.0');
      expect(url).toBe('https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.msi');
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('getNodeInstallCommand', () => {
    it('should generate macOS install command', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const cmd = getNodeInstallCommand('/tmp/node.pkg');
      expect(cmd).toEqual({
        cmd: 'sudo',
        args: ['installer', '-pkg', '/tmp/node.pkg', '-target', '/'],
        useSudo: true,
      });
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should generate Windows install command', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const cmd = getNodeInstallCommand('C:\\temp\\node.msi');
      expect(cmd).toEqual({
        cmd: 'msiexec',
        args: ['/i', 'C:\\temp\\node.msi', '/quiet'],
        useSudo: false,
      });
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });
});
```

- [ ] **Step 2: Write failing test for shell utils**

Create `src/main/utils/shell.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { createRunCommand } from './shell';
import { GlobalLogger } from '../logger';

describe('shell utils', () => {
  it('should execute a command and return stdout', async () => {
    const logger = new GlobalLogger();
    const runCommand = createRunCommand(logger);
    const result = await runCommand('node', ['-e', 'console.log("hello")']);
    expect(result.stdout.trim()).toBe('hello');
    expect(result.exitCode).toBe(0);
  });

  it('should capture stderr', async () => {
    const logger = new GlobalLogger();
    const runCommand = createRunCommand(logger);
    const result = await runCommand('node', ['-e', 'console.error("err msg")']);
    expect(result.stderr.trim()).toBe('err msg');
    expect(result.exitCode).toBe(0);
  });

  it('should report non-zero exit codes', async () => {
    const logger = new GlobalLogger();
    const runCommand = createRunCommand(logger);
    const result = await runCommand('node', ['-e', 'process.exit(1)']);
    expect(result.exitCode).toBe(1);
  });

  it('should log executed commands to logger', async () => {
    const logger = new GlobalLogger();
    const runCommand = createRunCommand(logger);
    await runCommand('node', ['-e', 'console.log("test")']);
    const logs = logger.getLogs();
    const hasCommandLog = logs.some((l) =>
      l.text.includes('执行命令:') && l.text.includes('node')
    );
    expect(hasCommandLog).toBe(true);
  });
});
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `pnpm test src/main/utils/`
Expected: ALL FAIL — modules not found

- [ ] **Step 4: Write platform utils implementation**

Create `src/main/utils/platform.ts`:

```typescript
export function getPlatform(): 'darwin' | 'win32' {
  const p = process.platform;
  if (p === 'darwin' || p === 'win32') return p;
  throw new Error(`Unsupported platform: ${p}`);
}

export function getNodeDownloadUrl(version: string): string {
  const platform = getPlatform();
  const ext = platform === 'darwin' ? 'pkg' : 'msi';
  const osName = platform === 'darwin' ? 'darwin' : 'win';
  return `https://nodejs.org/dist/${version}/node-${version}-${osName}-x64.${ext}`;
}

export function getNodeInstallCommand(pkgPath: string): {
  cmd: string;
  args: string[];
  useSudo: boolean;
} {
  const platform = getPlatform();
  if (platform === 'darwin') {
    return {
      cmd: 'sudo',
      args: ['installer', '-pkg', pkgPath, '-target', '/'],
      useSudo: true,
    };
  }
  return {
    cmd: 'msiexec',
    args: ['/i', pkgPath, '/quiet'],
    useSudo: false,
  };
}

export function getDefaultShell(): string {
  return getPlatform() === 'darwin' ? '/bin/zsh' : 'cmd.exe';
}
```

- [ ] **Step 5: Write shell utils implementation**

Create `src/main/utils/shell.ts`:

```typescript
import { spawn } from 'child_process';
import { GlobalLogger } from '../logger';

export interface RunCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

export function createRunCommand(logger: GlobalLogger) {
  return function runCommand(
    cmd: string,
    args: string[],
    opts?: { cwd?: string }
  ): Promise<RunCommandResult> {
    const commandStr = `${cmd} ${args.join(' ')}`;
    logger.log(`执行命令: ${commandStr}`);

    return new Promise((resolve) => {
      const child = spawn(cmd, args, {
        cwd: opts?.cwd,
        shell: true,
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data: Buffer) => {
        const text = data.toString();
        stdout += text;
        text.split('\n').filter(Boolean).forEach((line) => logger.log(line));
      });

      child.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        text.split('\n').filter(Boolean).forEach((line) => logger.log(line));
      });

      child.on('close', (code) => {
        const exitCode = code ?? 1;
        logger.log(`命令完成，退出码: ${exitCode}`);
        resolve({ stdout, stderr, exitCode });
      });

      child.on('error', (err) => {
        logger.log(`命令执行失败: ${err.message}`);
        resolve({ stdout, stderr: err.message, exitCode: 1 });
      });
    });
  };
}
```

- [ ] **Step 6: Run tests to verify they pass**

Run: `pnpm test src/main/utils/`
Expected: ALL PASS

- [ ] **Step 7: Commit**

```bash
git add src/main/utils/
git commit -m "feat: add platform detection and shell execution utils"
```

---

### Task 4: Download Utils

**Files:**
- Create: `src/main/utils/download.ts`
- Create: `src/main/utils/download.test.ts`

**Interfaces:**
- Consumes: GlobalLogger from Task 2
- Produces:
  - `createDownloader(logger: GlobalLogger): (url: string, destPath: string, onProgress?: (percent: number, downloaded: number, total: number) => void) => Promise<void>`
  - 内置 3 次重试，间隔 3s / 6s / 12s

---

- [ ] **Step 1: Write failing tests for download**

Create `src/main/utils/download.test.ts`:

```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { createDownloader } from './download';
import { GlobalLogger } from '../logger';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFileSync, unlinkSync, existsSync } from 'fs';

describe('download utils', () => {
  let server: ReturnType<typeof createServer>;
  let serverUrl: string;
  let logger: GlobalLogger;

  beforeEach(() => {
    logger = new GlobalLogger();
  });

  afterEach(() => {
    if (server) server.close();
  });

  function startServer(content: Buffer, statusCode = 200) {
    return new Promise<void>((resolve) => {
      server = createServer((_req: IncomingMessage, res: ServerResponse) => {
        res.writeHead(statusCode, { 'Content-Length': String(content.length) });
        res.end(content);
      });
      server.listen(0, () => {
        const addr = server.address() as { port: number };
        serverUrl = `http://localhost:${addr.port}/test-file`;
        resolve();
      });
    });
  }

  it('should download a file and save to disk', async () => {
    const content = Buffer.from('hello download test');
    await startServer(content);
    const download = createDownloader(logger);
    const destPath = join(tmpdir(), `test-download-${Date.now()}.txt`);

    try {
      await download(serverUrl, destPath);
      expect(existsSync(destPath)).toBe(true);
      expect(readFileSync(destPath, 'utf-8')).toBe('hello download test');
    } finally {
      if (existsSync(destPath)) unlinkSync(destPath);
    }
  });

  it('should report progress during download', async () => {
    const content = Buffer.alloc(10000, 'x');
    await startServer(content);
    const download = createDownloader(logger);
    const destPath = join(tmpdir(), `test-download-${Date.now()}.txt`);
    const progressCalls: Array<{ percent: number }> = [];

    try {
      await download(serverUrl, destPath, (percent) => {
        progressCalls.push({ percent });
      });
      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[progressCalls.length - 1].percent).toBe(100);
    } finally {
      if (existsSync(destPath)) unlinkSync(destPath);
    }
  });

  it('should log download URL to logger', async () => {
    const content = Buffer.from('test');
    await startServer(content);
    const download = createDownloader(logger);
    const destPath = join(tmpdir(), `test-download-${Date.now()}.txt`);

    try {
      await download(serverUrl, destPath);
      const logs = logger.getLogs();
      const hasUrlLog = logs.some((l) => l.text.includes(serverUrl));
      expect(hasUrlLog).toBe(true);
    } finally {
      if (existsSync(destPath)) unlinkSync(destPath);
    }
  });

  it('should throw on 404 response', async () => {
    await startServer(Buffer.from('not found'), 404);
    const download = createDownloader(logger);
    const destPath = join(tmpdir(), `test-download-${Date.now()}.txt`);

    await expect(download(serverUrl, destPath)).rejects.toThrow();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/utils/download.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write download utils implementation**

Create `src/main/utils/download.ts`:

```typescript
import { get } from 'https';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { dirname } from 'path';
import { GlobalLogger } from '../logger';

export function createDownloader(logger: GlobalLogger) {
  return async function downloadFile(
    url: string,
    destPath: string,
    onProgress?: (percent: number, downloaded: number, total: number) => void
  ): Promise<void> {
    const maxRetries = 3;
    const retryDelays = [3000, 6000, 12000];

    logger.log(`下载地址: ${url}`);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.log(`重试第 ${attempt} 次...`);
        }
        await doDownload(url, destPath, onProgress);
        logger.log(`下载完成`);
        return;
      } catch (err: any) {
        logger.log(`下载失败: ${err.message}`);
        if (attempt < maxRetries) {
          const delay = retryDelays[attempt];
          logger.log(`等待 ${delay / 1000}s 后重试...`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw new Error(`下载失败，已重试 ${maxRetries} 次: ${err.message}`);
        }
      }
    }
  };
}

function doDownload(
  url: string,
  destPath: string,
  onProgress?: (percent: number, downloaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = dirname(destPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const file = createWriteStream(destPath);

    const req = get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          if (existsSync(destPath)) unlinkSync(destPath);
          doDownload(redirectUrl, destPath, onProgress).then(resolve, reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        if (existsSync(destPath)) unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const total = parseInt(response.headers['content-length'] || '0', 10);
      let downloaded = 0;

      response.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        if (total > 0 && onProgress) {
          const percent = Math.round((downloaded / total) * 100);
          onProgress(percent, downloaded, total);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        if (total > 0 && onProgress) onProgress(100, downloaded, total);
        resolve();
      });

      file.on('error', (err) => {
        file.close();
        if (existsSync(destPath)) unlinkSync(destPath);
        reject(err);
      });
    });

    req.on('error', (err) => {
      if (existsSync(destPath)) unlinkSync(destPath);
      reject(err);
    });

    req.setTimeout(300000, () => {
      req.destroy();
      if (existsSync(destPath)) unlinkSync(destPath);
      reject(new Error('下载超时'));
    });
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/utils/download.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/utils/download.ts src/main/utils/download.test.ts
git commit -m "feat: add download utility with progress reporting and retry"
```

---

### Task 5: Environment Check Module

**Files:**
- Create: `src/main/modules/env-check.ts`
- Create: `src/main/modules/env-check.test.ts`

**Interfaces:**
- Consumes: GlobalLogger from Task 2, `createRunCommand` from Task 3
- Produces:
  - `checkNode(runCommand): Promise<string | null>`
  - `checkPnpm(runCommand): Promise<string | null>`
  - `checkEnv(runCommand): Promise<{ node: string | null; pnpm: string | null; platform: string }>`

---

- [ ] **Step 1: Write failing tests for env-check**

Create `src/main/modules/env-check.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { checkNode, checkPnpm, checkEnv } from './env-check';
import { createRunCommand } from '../utils/shell';
import { GlobalLogger } from '../logger';

describe('env-check', () => {
  const logger = new GlobalLogger();
  const runCommand = createRunCommand(logger);

  describe('checkNode', () => {
    it('should return node version when installed', async () => {
      const version = await checkNode(runCommand);
      if (version) {
        expect(version).toMatch(/^v\d+\.\d+\.\d+/);
      }
    });
  });

  describe('checkPnpm', () => {
    it('should return pnpm version when installed', async () => {
      const version = await checkPnpm(runCommand);
      if (version) {
        expect(version).toMatch(/^\d+\.\d+\.\d+/);
      }
    });
  });

  describe('checkEnv', () => {
    it('should return env status with platform', async () => {
      const result = await checkEnv(runCommand);
      expect(result).toHaveProperty('node');
      expect(result).toHaveProperty('pnpm');
      expect(result).toHaveProperty('platform');
      expect(['darwin', 'win32']).toContain(result.platform);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/modules/env-check.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write env-check implementation**

Create `src/main/modules/env-check.ts`:

```typescript
import { getPlatform } from '../utils/platform';

export async function checkNode(
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>
): Promise<string | null> {
  const result = await runCommand('node', ['-v']);
  if (result.exitCode === 0 && result.stdout.trim()) {
    return result.stdout.trim();
  }
  return null;
}

export async function checkPnpm(
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>
): Promise<string | null> {
  const result = await runCommand('pnpm', ['-v']);
  if (result.exitCode === 0 && result.stdout.trim()) {
    return result.stdout.trim();
  }
  return null;
}

export async function checkEnv(
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>
): Promise<{ node: string | null; pnpm: string | null; platform: string }> {
  const [node, pnpm] = await Promise.all([
    checkNode(runCommand),
    checkPnpm(runCommand),
  ]);
  return {
    node,
    pnpm,
    platform: getPlatform(),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/modules/env-check.test.ts`
Expected: ALL PASS (note: checkNode/checkPnpm will return null if not installed, which is valid)

- [ ] **Step 5: Commit**

```bash
git add src/main/modules/env-check.ts src/main/modules/env-check.test.ts
git commit -m "feat: add environment check module (node, pnpm)"
```

---

### Task 6: Node.js Install Module

**Files:**
- Create: `src/main/modules/node-install.ts`
- Create: `src/main/modules/node-install.test.ts`

**Interfaces:**
- Consumes: GlobalLogger (Task 2), platform utils (Task 3), shell utils (Task 3), download utils (Task 4)
- Produces:
  - `installNode(downloadFile, runCommand, onProgress, onLog?): Promise<{ success: boolean; version: string }>`

---

- [ ] **Step 1: Write failing tests for node-install**

Create `src/main/modules/node-install.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { installNode } from './node-install';
import { GlobalLogger } from '../logger';

describe('node-install', () => {
  let logger: GlobalLogger;

  beforeEach(() => {
    logger = new GlobalLogger();
  });

  function makeRunCommand(outputs: Array<{ stdout: string; exitCode: number }>) {
    let callIndex = 0;
    return async (_cmd: string, _args: string[]) => {
      const output = outputs[callIndex] || outputs[outputs.length - 1];
      callIndex++;
      return { stdout: output.stdout, stderr: '', exitCode: output.exitCode };
    };
  }

  function makeDownload() {
    return async (
      _url: string,
      _dest: string,
      onProgress?: (p: number, d: number, t: number) => void
    ) => {
      if (onProgress) {
        onProgress(50, 29_000_000, 58_000_000);
        onProgress(100, 58_000_000, 58_000_000);
      }
    };
  }

  it('should skip install if node is already present', async () => {
    const runCommand = makeRunCommand([
      { stdout: 'v20.11.0', exitCode: 0 }, // check node
    ]);
    const download = makeDownload();

    const result = await installNode(download, runCommand, () => {}, logger.log);
    expect(result.success).toBe(true);
    expect(result.version).toBe('v20.11.0');
    const logs = logger.getLogs();
    expect(logs.some((l) => l.text.includes('Node.js 已安装'))).toBe(true);
  });

  it('should download and install node if not present', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 1 },                     // check node (not found)
      { stdout: '', exitCode: 0 },                     // fetch version
      { stdout: '', exitCode: 0 },                     // install command
      { stdout: 'v20.11.0', exitCode: 0 },             // verify
    ]);
    const download = makeDownload();

    const progressCalls: number[] = [];
    const result = await installNode(download, runCommand, (p) => progressCalls.push(p), logger.log);
    expect(result.success).toBe(true);
    expect(result.version).toBe('v20.11.0');
    expect(progressCalls.length).toBeGreaterThan(0);
  });

  it('should fail if node verification fails after install', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 1 },                     // check node (not found)
      { stdout: '', exitCode: 0 },                     // fetch version
      { stdout: '', exitCode: 0 },                     // install command
      { stdout: '', exitCode: 1 },                     // verify fails
    ]);
    const download = makeDownload();

    const result = await installNode(download, runCommand, () => {}, logger.log);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/modules/node-install.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write node-install implementation**

Create `src/main/modules/node-install.ts`:

```typescript
import { join } from 'path';
import { tmpdir } from 'os';
import { get } from 'https';
import { getNodeDownloadUrl, getNodeInstallCommand, getPlatform } from '../utils/platform';

export async function installNode(
  downloadFile: (url: string, dest: string, onProgress?: (p: number, d: number, t: number) => void) => Promise<void>,
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>,
  onProgress: (percent: number, message: string) => void,
  onLog: (text: string) => void
): Promise<{ success: boolean; version: string }> {
  // Check existing
  const existing = await runCommand('node', ['-v']);
  if (existing.exitCode === 0 && existing.stdout.trim()) {
    const version = existing.stdout.trim();
    onLog(`Node.js 已安装: ${version}`);
    onProgress(100, `Node.js 已安装: ${version}`);
    return { success: true, version };
  }

  onLog('Node.js 未安装，开始安装...');
  onProgress(0, '正在获取最新版本号...');

  // Fetch latest version
  const version = await fetchLatestNodeVersion();
  onLog(`最新版本: ${version}`);
  const downloadUrl = getNodeDownloadUrl(version);
  const ext = getPlatform() === 'darwin' ? 'pkg' : 'msi';
  const pkgPath = join(tmpdir(), `node-${version}-${Date.now()}.${ext}`);

  onProgress(5, '正在下载 Node.js...');
  await downloadFile(downloadUrl, pkgPath, (percent) => {
    onProgress(5 + Math.round(percent * 0.7), `下载中: ${percent}%`);
  });

  // Install
  onProgress(75, '正在安装 Node.js...');
  const installCmd = getNodeInstallCommand(pkgPath);
  const installResult = await runCommand(installCmd.cmd, installCmd.args);

  if (installResult.exitCode !== 0) {
    onLog(`安装失败: ${installResult.stderr}`);
    return { success: false, version: '' };
  }

  // Verify
  onProgress(95, '正在验证安装...');
  const verify = await runCommand('node', ['-v']);
  if (verify.exitCode === 0 && verify.stdout.trim()) {
    const v = verify.stdout.trim();
    onLog(`Node.js 安装成功: ${v}`);
    onProgress(100, `Node.js ${v} 安装成功 ✓`);
    return { success: true, version: v };
  }

  onLog('Node.js 安装后验证失败');
  return { success: false, version: '' };
}

function fetchLatestNodeVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    get('https://nodejs.org/dist/latest/SHASUMS256.txt', (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirect = res.headers.location;
        if (redirect) {
          fetchLatestNodeVersionFromUrl(redirect).then(resolve, reject);
          return;
        }
      }
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => {
        const match = data.match(/node-(v\d+\.\d+\.\d+)/);
        if (match) {
          resolve(match[1]);
        } else {
          reject(new Error('无法解析最新 Node.js 版本号'));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function fetchLatestNodeVersionFromUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => {
        const match = data.match(/node-(v\d+\.\d+\.\d+)/);
        if (match) resolve(match[1]);
        else reject(new Error('无法解析最新 Node.js 版本号'));
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/modules/node-install.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/modules/node-install.ts src/main/modules/node-install.test.ts
git commit -m "feat: add Node.js download and install module"
```

---

### Task 7: pnpm Install Module

**Files:**
- Create: `src/main/modules/pnpm-install.ts`
- Create: `src/main/modules/pnpm-install.test.ts`

**Interfaces:**
- Consumes: GlobalLogger (Task 2), shell utils (Task 3)
- Produces:
  - `installPnpm(runCommand, onProgress, onLog): Promise<{ success: boolean; version: string }>`

---

- [ ] **Step 1: Write failing tests for pnpm-install**

Create `src/main/modules/pnpm-install.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { installPnpm } from './pnpm-install';
import { GlobalLogger } from '../logger';

describe('pnpm-install', () => {
  const logger = new GlobalLogger();

  function makeRunCommand(outputs: Array<{ stdout: string; exitCode: number }>) {
    let callIndex = 0;
    return async (_cmd: string, _args: string[]) => {
      const output = outputs[callIndex] || outputs[outputs.length - 1];
      callIndex++;
      return { stdout: output.stdout, stderr: '', exitCode: output.exitCode };
    };
  }

  it('should skip install if pnpm is already present', async () => {
    const runCommand = makeRunCommand([
      { stdout: '9.0.0', exitCode: 0 }, // check pnpm
    ]);

    const result = await installPnpm(runCommand, () => {}, logger.log);
    expect(result.success).toBe(true);
    expect(result.version).toBe('9.0.0');
    expect(logger.getLogs().some((l) => l.text.includes('pnpm 已安装'))).toBe(true);
  });

  it('should install pnpm if not present', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 1 },        // check pnpm (not found)
      { stdout: '', exitCode: 0 },        // npm install -g pnpm
      { stdout: '9.0.0', exitCode: 0 },   // verify
    ]);

    const result = await installPnpm(runCommand, () => {}, logger.log);
    expect(result.success).toBe(true);
    expect(result.version).toBe('9.0.0');
  });

  it('should fail if pnpm verification fails', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 1 },        // check pnpm (not found)
      { stdout: '', exitCode: 0 },        // npm install -g pnpm
      { stdout: '', exitCode: 1 },        // verify fails
    ]);

    const result = await installPnpm(runCommand, () => {}, logger.log);
    expect(result.success).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/modules/pnpm-install.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write pnpm-install implementation**

Create `src/main/modules/pnpm-install.ts`:

```typescript
export async function installPnpm(
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>,
  onProgress: (percent: number, message: string) => void,
  onLog: (text: string) => void
): Promise<{ success: boolean; version: string }> {
  // Check existing
  const existing = await runCommand('pnpm', ['-v']);
  if (existing.exitCode === 0 && existing.stdout.trim()) {
    const version = existing.stdout.trim();
    onLog(`pnpm 已安装: ${version}`);
    onProgress(100, `pnpm 已安装: ${version}`);
    return { success: true, version };
  }

  onLog('pnpm 未安装，正在安装...');
  onProgress(20, '正在安装 pnpm...');

  const installResult = await runCommand('npm', ['install', '-g', 'pnpm']);

  if (installResult.exitCode !== 0) {
    onLog(`pnpm 安装失败: ${installResult.stderr}`);
    return { success: false, version: '' };
  }

  // Verify
  onProgress(80, '正在验证 pnpm 安装...');
  const verify = await runCommand('pnpm', ['-v']);
  if (verify.exitCode === 0 && verify.stdout.trim()) {
    const version = verify.stdout.trim();
    onLog(`pnpm 安装成功: ${version}`);
    onProgress(100, `pnpm ${version} 安装成功 ✓`);
    return { success: true, version: version };
  }

  onLog('pnpm 安装后验证失败');
  return { success: false, version: '' };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/modules/pnpm-install.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/modules/pnpm-install.ts src/main/modules/pnpm-install.test.ts
git commit -m "feat: add pnpm install module"
```

---

### Task 8: Claude Code Install Module

**Files:**
- Create: `src/main/modules/cc-install.ts`
- Create: `src/main/modules/cc-install.test.ts`

**Interfaces:**
- Consumes: GlobalLogger (Task 2), shell utils (Task 3)
- Produces:
  - `installClaudeCode(runCommand, onProgress, onLog): Promise<{ success: boolean; version: string }>`

---

- [ ] **Step 1: Write failing tests for cc-install**

Create `src/main/modules/cc-install.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { installClaudeCode } from './cc-install';
import { GlobalLogger } from '../logger';

describe('cc-install', () => {
  const logger = new GlobalLogger();

  function makeRunCommand(outputs: Array<{ stdout: string; exitCode: number }>) {
    let callIndex = 0;
    return async (_cmd: string, _args: string[]) => {
      const output = outputs[callIndex] || outputs[outputs.length - 1];
      callIndex++;
      return { stdout: output.stdout, stderr: '', exitCode: output.exitCode };
    };
  }

  it('should install Claude Code via pnpm', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 0 },               // pnpm install
      { stdout: '1.0.0', exitCode: 0 },           // verify
    ]);

    const progressCalls: Array<{ percent: number; message: string }> = [];
    const result = await installClaudeCode(runCommand, (p, m) => progressCalls.push({ percent: p, message: m }), logger.log);
    expect(result.success).toBe(true);
    expect(result.version).toBe('1.0.0');
  });

  it('should fail if install command fails', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 1 },               // pnpm install fails
      { stdout: '', exitCode: 1 },               // verify fails
    ]);

    const result = await installClaudeCode(runCommand, () => {}, logger.log);
    expect(result.success).toBe(false);
  });

  it('should report progress during install', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 0 },               // pnpm install
      { stdout: '1.0.0', exitCode: 0 },           // verify
    ]);

    const progressMessages: string[] = [];
    await installClaudeCode(runCommand, (_p, m) => progressMessages.push(m), logger.log);
    expect(progressMessages.length).toBeGreaterThan(0);
    expect(progressMessages.some((m) => m.includes('安装'))).toBe(true);
    expect(progressMessages.some((m) => m.includes('验证'))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/modules/cc-install.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write cc-install implementation**

Create `src/main/modules/cc-install.ts`:

```typescript
export async function installClaudeCode(
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>,
  onProgress: (percent: number, message: string) => void,
  onLog: (text: string) => void
): Promise<{ success: boolean; version: string }> {
  onLog('开始安装 Claude Code...');
  onProgress(0, '正在通过 pnpm 安装 Claude Code...');

  const installResult = await runCommand('pnpm', [
    'install',
    '-g',
    '@anthropic-ai/claude-code',
  ]);

  if (installResult.exitCode !== 0) {
    onLog(`Claude Code 安装失败: ${installResult.stderr}`);
    return { success: false, version: '' };
  }

  onProgress(80, '正在验证 Claude Code 安装...');

  const verify = await runCommand('claude', ['--version']);
  if (verify.exitCode === 0 && verify.stdout.trim()) {
    const version = verify.stdout.trim();
    onLog(`Claude Code 安装成功: ${version}`);
    onProgress(100, `Claude Code ${version} 安装成功 ✓`);
    return { success: true, version };
  }

  // --version might not be supported, try which
  const which = await runCommand('claude', ['--help']);
  if (which.exitCode === 0) {
    onLog('Claude Code 安装成功');
    onProgress(100, 'Claude Code 安装成功 ✓');
    return { success: true, version: 'unknown' };
  }

  onLog('Claude Code 安装后验证失败');
  return { success: false, version: '' };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/modules/cc-install.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/modules/cc-install.ts src/main/modules/cc-install.test.ts
git commit -m "feat: add Claude Code install module via pnpm"
```

---

### Task 9: Config Generation Module

**Files:**
- Create: `src/main/modules/config-gen.ts`
- Create: `src/main/modules/config-gen.test.ts`

**Interfaces:**
- Consumes: GlobalLogger (Task 2)
- Produces:
  - `generateConfig(apiKey: string, baseUrl?: string): Promise<{ success: boolean; filePath: string; message: string }>`

---

- [ ] **Step 1: Write failing tests for config-gen**

Create `src/main/modules/config-gen.test.ts`:

```typescript
import { describe, it, expect, afterEach } from 'vitest';
import { generateConfig } from './config-gen';
import { GlobalLogger } from '../logger';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFileSync, unlinkSync, existsSync } from 'fs';

describe('config-gen', () => {
  const logger = new GlobalLogger();
  const testConfigPath = join(tmpdir(), `test-claude-${Date.now()}.json`);

  afterEach(() => {
    if (existsSync(testConfigPath)) unlinkSync(testConfigPath);
  });

  it('should generate valid JSON config with apiKey', async () => {
    const result = await generateConfig('sk-test-key-123', testConfigPath, logger);

    expect(result.success).toBe(true);
    expect(result.filePath).toBe(testConfigPath);
    expect(existsSync(testConfigPath)).toBe(true);

    const content = JSON.parse(readFileSync(testConfigPath, 'utf-8'));
    expect(content.apiKey).toBe('sk-test-key-123');
    expect(content.model).toBeDefined();
  });

  it('should use default DeepSeek base URL when not provided', async () => {
    const result = await generateConfig('sk-key', testConfigPath, logger);
    expect(result.success).toBe(true);

    const content = JSON.parse(readFileSync(testConfigPath, 'utf-8'));
    expect(content.baseUrl).toBe('https://api.deepseek.com');
  });

  it('should use custom base URL when provided', async () => {
    const result = await generateConfig('sk-key', testConfigPath, logger, 'https://custom.api.com');
    expect(result.success).toBe(true);

    const content = JSON.parse(readFileSync(testConfigPath, 'utf-8'));
    expect(content.baseUrl).toBe('https://custom.api.com');
  });

  it('should fail with empty apiKey', async () => {
    const result = await generateConfig('', testConfigPath, logger);
    expect(result.success).toBe(false);
    expect(result.message).toContain('API Key 不能为空');
  });

  it('should write model as deepseek-chat', async () => {
    const result = await generateConfig('sk-key', testConfigPath, logger);
    expect(result.success).toBe(true);

    const content = JSON.parse(readFileSync(testConfigPath, 'utf-8'));
    expect(content.model).toBe('deepseek-chat');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `pnpm test src/main/modules/config-gen.test.ts`
Expected: FAIL — module not found

- [ ] **Step 3: Write config-gen implementation**

Create `src/main/modules/config-gen.ts`:

```typescript
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { GlobalLogger } from '../logger';

interface ClaudeConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export async function generateConfig(
  apiKey: string,
  filePath: string,
  logger: GlobalLogger,
  baseUrl?: string
): Promise<{ success: boolean; filePath: string; message: string }> {
  logger.log('正在生成 DeepSeek 配置...');

  if (!apiKey || !apiKey.trim()) {
    const msg = 'API Key 不能为空';
    logger.log(`配置失败: ${msg}`);
    return { success: false, filePath, message: msg };
  }

  const config: ClaudeConfig = {
    apiKey: apiKey.trim(),
    model: 'deepseek-chat',
    baseUrl: baseUrl || 'https://api.deepseek.com',
  };

  try {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
    logger.log(`配置文件已保存到: ${filePath}`);
    logger.log(`模型: ${config.model}`);
    logger.log(`API 地址: ${config.baseUrl}`);

    return {
      success: true,
      filePath,
      message: `配置成功！模型: ${config.model}, API: ${config.baseUrl}`,
    };
  } catch (err: any) {
    const msg = `写入配置文件失败: ${err.message}`;
    logger.log(msg);
    return { success: false, filePath, message: msg };
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `pnpm test src/main/modules/config-gen.test.ts`
Expected: ALL PASS

- [ ] **Step 5: Commit**

```bash
git add src/main/modules/config-gen.ts src/main/modules/config-gen.test.ts
git commit -m "feat: add DeepSeek config generation module"
```

---

### Task 10: Preload Script

**Files:**
- Create: `src/preload/index.ts`

**Interfaces:**
- Consumes: (none — runs in preload context)
- Produces: `window.api` with all IPC methods exposed via contextBridge

---

- [ ] **Step 1: Write preload script**

Create `src/preload/index.ts`:

```typescript
import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Environment check
  checkEnv: (): Promise<{ node: string | null; pnpm: string | null; platform: string }> =>
    ipcRenderer.invoke('check-env'),

  // Install steps
  installNode: (): Promise<void> =>
    ipcRenderer.invoke('install-node'),

  installPnpm: (): Promise<void> =>
    ipcRenderer.invoke('install-pnpm'),

  installClaudeCode: (): Promise<void> =>
    ipcRenderer.invoke('install-claude-code'),

  // Config generation
  generateConfig: (apiKey: string, baseUrl?: string): Promise<{ success: boolean; filePath: string; message: string }> =>
    ipcRenderer.invoke('generate-config', { apiKey, baseUrl }),

  // Log export
  exportLogs: (): Promise<void> =>
    ipcRenderer.invoke('export-logs'),

  // Events (Main → Renderer)
  onProgress: (callback: (data: { step: number; percent: number; message: string }) => void): void => {
    ipcRenderer.on('install-progress', (_event, data) => callback(data));
  },

  onLog: (callback: (data: { timestamp: string; text: string }) => void): void => {
    ipcRenderer.on('install-log', (_event, data) => callback(data));
  },

  onError: (callback: (data: { step: number; error: string; retryable: boolean; skippable: boolean }) => void): void => {
    ipcRenderer.on('install-error', (_event, data) => callback(data));
  },

  // Close guard
  setCloseGuard: (message: string): void => {
    ipcRenderer.send('set-close-guard', message);
  },

  clearCloseGuard: (): void => {
    ipcRenderer.send('clear-close-guard');
  },
});
```

- [ ] **Step 2: Commit**

```bash
git add src/preload/index.ts
git commit -m "feat: add preload script with IPC bridge"
```

---

### Task 11: IPC Handlers + Main Entry

**Files:**
- Create: `src/main/ipc-handlers.ts`
- Create: `src/main/index.ts`

**Interfaces:**
- Consumes: All modules from Tasks 2–9, preload from Task 10
- Produces: 完整的 Electron 应用入口，窗口管理，IPC 通道注册

---

- [ ] **Step 1: Write IPC handlers**

Create `src/main/ipc-handlers.ts`:

```typescript
import { ipcMain, dialog, BrowserWindow } from 'electron';
import { GlobalLogger } from './logger';
import { createRunCommand } from './utils/shell';
import { createDownloader } from './utils/download';
import { checkEnv } from './modules/env-check';
import { installNode } from './modules/node-install';
import { installPnpm } from './modules/pnpm-install';
import { installClaudeCode } from './modules/cc-install';
import { generateConfig } from './modules/config-gen';
import { join } from 'path';
import { homedir } from 'os';
import { writeFileSync } from 'fs';

let closeGuardMessage: string | null = null;

export function registerIpcHandlers(logger: GlobalLogger): void {
  const runCommand = createRunCommand(logger);
  const downloadFile = createDownloader(logger);

  // env check
  ipcMain.handle('check-env', async () => {
    return await checkEnv(runCommand);
  });

  // node install
  ipcMain.handle('install-node', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const sendProgress = (step: number, percent: number, message: string) => {
      win?.webContents.send('install-progress', { step: 2, percent, message });
    };
    const sendLog = (text: string) => {
      logger.log(text);
      const entry = logger.getLogs()[logger.getLogs().length - 1];
      win?.webContents.send('install-log', entry);
    };

    const result = await installNode(downloadFile, runCommand, sendProgress, sendLog);
    if (!result.success) {
      win?.webContents.send('install-error', {
        step: 2,
        error: `Node.js 安装失败`,
        retryable: true,
        skippable: true,
      });
    }
    return result;
  });

  // pnpm install
  ipcMain.handle('install-pnpm', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const sendProgress = (percent: number, message: string) => {
      win?.webContents.send('install-progress', { step: 3, percent, message });
    };
    const sendLog = (text: string) => {
      logger.log(text);
      const entry = logger.getLogs()[logger.getLogs().length - 1];
      win?.webContents.send('install-log', entry);
    };

    const result = await installPnpm(runCommand, sendProgress, sendLog);
    if (!result.success) {
      win?.webContents.send('install-error', {
        step: 3,
        error: 'pnpm 安装失败',
        retryable: true,
        skippable: true,
      });
    }
    return result;
  });

  // Claude Code install
  ipcMain.handle('install-claude-code', async () => {
    const win = BrowserWindow.getFocusedWindow();
    const sendProgress = (percent: number, message: string) => {
      win?.webContents.send('install-progress', { step: 4, percent, message });
    };
    const sendLog = (text: string) => {
      logger.log(text);
      const entry = logger.getLogs()[logger.getLogs().length - 1];
      win?.webContents.send('install-log', entry);
    };

    const result = await installClaudeCode(runCommand, sendProgress, sendLog);
    if (!result.success) {
      win?.webContents.send('install-error', {
        step: 4,
        error: 'Claude Code 安装失败',
        retryable: true,
        skippable: false,
      });
    }
    return result;
  });

  // config generation
  ipcMain.handle('generate-config', async (_event, { apiKey, baseUrl }) => {
    const win = BrowserWindow.getFocusedWindow();
    const configPath = join(homedir(), '.claude.json');
    const result = await generateConfig(apiKey, configPath, logger, baseUrl);
    win?.webContents.send('install-progress', {
      step: 5,
      percent: result.success ? 100 : 0,
      message: result.message,
    });
    return result;
  });

  // log export
  ipcMain.handle('export-logs', async () => {
    const win = BrowserWindow.getFocusedWindow();
    if (!win) return;

    const result = await dialog.showSaveDialog(win, {
      title: '导出日志',
      defaultPath: `cc-installer-log-${new Date().toISOString().slice(0, 10)}.txt`,
      filters: [{ name: '文本文件', extensions: ['txt'] }],
    });

    if (!result.canceled && result.filePath) {
      const content = logger.exportToString();
      writeFileSync(result.filePath, content, 'utf-8');
      logger.log(`日志已导出到: ${result.filePath}`);
    }
  });

  // close guard
  ipcMain.on('set-close-guard', (_event, message: string) => {
    closeGuardMessage = message;
  });

  ipcMain.on('clear-close-guard', () => {
    closeGuardMessage = null;
  });
}

export function getCloseGuardMessage(): string | null {
  return closeGuardMessage;
}
```

- [ ] **Step 2: Write main entry**

Create `src/main/index.ts`:

```typescript
import { app, BrowserWindow, dialog } from 'electron';
import { join } from 'path';
import { GlobalLogger } from './logger';
import { registerIpcHandlers, getCloseGuardMessage } from './ipc-handlers';

const logger = new GlobalLogger();

function createWindow(): void {
  const win = new BrowserWindow({
    width: 720,
    height: 580,
    resizable: false,
    title: 'Claude Code Installer',
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile(join(__dirname, '../renderer/index.html'));
  win.setMenuBarVisibility(false);

  // Close guard
  win.on('close', async (e) => {
    const guardMsg = getCloseGuardMessage();
    if (guardMsg) {
      e.preventDefault();
      const { response } = await dialog.showMessageBox(win, {
        type: 'question',
        buttons: ['确定退出', '继续安装'],
        defaultId: 1,
        title: '确认退出',
        message: guardMsg,
      });
      if (response === 0) {
        // User chose to exit — clear guard and actually quit
        app.exit(0);
      }
    }
  });
}

app.whenReady().then(() => {
  registerIpcHandlers(logger);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  app.quit();
});
```

- [ ] **Step 3: Verify TypeScript compilation**

Run: `npx tsc --noEmit`
Expected: No type errors (renderer files are excluded in tsconfig)

- [ ] **Step 4: Commit**

```bash
git add src/main/ipc-handlers.ts src/main/index.ts
git commit -m "feat: add IPC handlers and main process entry with close guard"
```

---

### Task 12: Renderer Shell (HTML + CSS + App State)

**Files:**
- Create: `src/renderer/index.html`
- Create: `src/renderer/style.css`
- Create: `src/renderer/app.js`

**Interfaces:**
- Consumes: Preload API from Task 10
- Produces: Wizard shell with step navigation, log panel, progress display

---

- [ ] **Step 1: Write HTML**

Create `src/renderer/index.html`:

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'">
  <title>Claude Code Installer</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <div id="app">
    <header>
      <h1>🖥️ Claude Code Installer</h1>
      <div class="step-indicator" id="step-indicator">
        <span class="step" data-step="1">1. 环境检测</span>
        <span class="step-arrow">→</span>
        <span class="step" data-step="2">2. Node.js</span>
        <span class="step-arrow">→</span>
        <span class="step" data-step="3">3. pnpm</span>
        <span class="step-arrow">→</span>
        <span class="step" data-step="4">4. Claude Code</span>
        <span class="step-arrow">→</span>
        <span class="step" data-step="5">5. 配置</span>
      </div>
    </header>

    <main id="step-content">
      <!-- Steps render here -->
    </main>

    <div class="log-panel" id="log-panel">
      <div class="log-header" id="log-toggle">
        <span>▼ 详细日志</span>
        <button id="export-btn" title="导出日志">📋 导出日志</button>
      </div>
      <div class="log-body" id="log-body">
        <div id="log-entries"></div>
      </div>
    </div>

    <footer>
      <button id="prev-btn" class="btn" disabled>上一步</button>
      <button id="next-btn" class="btn btn-primary">下一步</button>
      <button id="retry-btn" class="btn btn-retry" style="display:none">重试</button>
      <button id="skip-btn" class="btn btn-skip" style="display:none">跳过</button>
    </footer>

    <div id="error-toast" class="toast error-toast" style="display:none"></div>
  </div>

  <script src="app.js"></script>
  <script src="steps/step1-check.js"></script>
  <script src="steps/step2-node.js"></script>
  <script src="steps/step3-pnpm.js"></script>
  <script src="steps/step4-cc.js"></script>
  <script src="steps/step5-config.js"></script>
</body>
</html>
```

- [ ] **Step 2: Write CSS**

Create `src/renderer/style.css`:

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Microsoft YaHei", sans-serif;
  background: #1a1a2e;
  color: #e0e0e0;
  overflow: hidden;
}

#app {
  display: flex;
  flex-direction: column;
  height: 100vh;
  padding: 16px;
}

header { text-align: center; margin-bottom: 16px; }
header h1 { font-size: 20px; color: #ffffff; }

.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  margin-top: 10px;
  font-size: 12px;
}

.step { color: #666; transition: color 0.3s; }
.step.active { color: #4fc3f7; font-weight: bold; }
.step.done { color: #66bb6a; }
.step.error { color: #ef5350; }
.step-arrow { color: #444; }

main { flex: 1; overflow-y: auto; padding: 8px 0; }

/* Log panel */
.log-panel { border-top: 1px solid #333; }
.log-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
  cursor: pointer;
  font-size: 12px;
  color: #888;
  user-select: none;
}
.log-header:hover { color: #aaa; }
.log-body { max-height: 160px; overflow-y: auto; font-family: "SF Mono", "Consolas", monospace; font-size: 11px; }
.log-body.collapsed { display: none; }

#log-entries { padding: 4px; }
.log-entry { color: #888; line-height: 1.5; white-space: pre-wrap; word-break: break-all; }

#export-btn {
  background: none;
  border: 1px solid #444;
  color: #888;
  padding: 2px 8px;
  font-size: 11px;
  cursor: pointer;
  border-radius: 3px;
}
#export-btn:hover { border-color: #4fc3f7; color: #4fc3f7; }

/* Footer */
footer {
  display: flex;
  justify-content: center;
  gap: 8px;
  padding: 10px 0 0 0;
}

.btn {
  padding: 8px 24px;
  border: 1px solid #444;
  background: #2a2a3e;
  color: #ccc;
  font-size: 13px;
  cursor: pointer;
  border-radius: 4px;
}
.btn:hover { background: #3a3a4e; }
.btn:disabled { opacity: 0.4; cursor: default; }
.btn-primary { background: #1565c0; border-color: #1565c0; color: #fff; }
.btn-primary:hover { background: #1976d2; }
.btn-retry { background: #e65100; border-color: #e65100; color: #fff; }
.btn-retry:hover { background: #f57c00; }
.btn-skip { background: #555; border-color: #555; }
.btn-skip:hover { background: #666; }

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 10px 20px;
  border-radius: 4px;
  font-size: 13px;
  z-index: 100;
}
.error-toast { background: #c62828; color: #fff; }

/* Step content common */
.step-content { padding: 8px 0; }
.step-title { font-size: 16px; margin-bottom: 12px; color: #fff; }
.status-row { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; font-size: 13px; }
.status-icon { font-size: 16px; }
.status-icon.ok { color: #66bb6a; }
.status-icon.missing { color: #ef5350; }

.progress-bar {
  width: 100%;
  height: 6px;
  background: #333;
  border-radius: 3px;
  margin: 12px 0;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: #4fc3f7;
  border-radius: 3px;
  transition: width 0.3s;
  width: 0%;
}

.form-group { margin-bottom: 12px; }
.form-group label { display: block; font-size: 12px; color: #aaa; margin-bottom: 4px; }
.form-group input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #444;
  background: #2a2a3e;
  color: #e0e0e0;
  font-size: 13px;
  border-radius: 4px;
}
.form-group input:focus { outline: none; border-color: #4fc3f7; }
.form-group input::placeholder { color: #555; }
```

- [ ] **Step 3: Write app.js (wizard state machine)**

Create `src/renderer/app.js`:

```javascript
// Wizard State Machine
const AppState = {
  currentStep: 1,
  totalSteps: 5,
  isInstalling: false,
  errorInfo: null,

  init() {
    this.bindEvents();
    this.setupIpcListeners();
    this.renderStep(1);
  },

  bindEvents() {
    document.getElementById('next-btn').addEventListener('click', () => this.goNext());
    document.getElementById('prev-btn').addEventListener('click', () => this.goPrev());
    document.getElementById('retry-btn').addEventListener('click', () => this.retry());
    document.getElementById('skip-btn').addEventListener('click', () => this.skip());

    // Log panel toggle
    document.getElementById('log-toggle').addEventListener('click', () => {
      document.getElementById('log-body').classList.toggle('collapsed');
    });

    // Export logs
    document.getElementById('export-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      window.api.exportLogs();
    });
  },

  setupIpcListeners() {
    window.api.onProgress((data) => {
      const step = Steps[this.currentStep];
      if (step && step.onProgress) step.onProgress(data);
    });

    window.api.onLog((data) => {
      this.appendLog(data.timestamp, data.text);
    });

    window.api.onError((data) => {
      this.showError(data);
    });
  },

  appendLog(timestamp, text) {
    const el = document.getElementById('log-entries');
    const div = document.createElement('div');
    div.className = 'log-entry';
    div.textContent = `[${timestamp}] ${text}`;
    el.appendChild(div);
    const logBody = document.getElementById('log-body');
    logBody.scrollTop = logBody.scrollHeight;
  },

  showError(data) {
    this.errorInfo = data;
    const toast = document.getElementById('error-toast');
    toast.textContent = `错误: ${data.error}`;
    toast.style.display = 'block';
    setTimeout(() => { toast.style.display = 'none'; }, 8000);

    if (data.retryable) {
      document.getElementById('retry-btn').style.display = '';
    }
    if (data.skippable) {
      document.getElementById('skip-btn').style.display = '';
    }
    document.getElementById('next-btn').disabled = false;
  },

  async goNext() {
    if (this.isInstalling) return;

    const step = Steps[this.currentStep];
    if (step && step.onNext) {
      const canProceed = await step.onNext();
      if (!canProceed) return;
    }

    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.renderStep(this.currentStep);
    }
  },

  goPrev() {
    if (this.isInstalling) return;
    if (this.currentStep > 1) {
      this.currentStep--;
      this.renderStep(this.currentStep);
    }
  },

  async retry() {
    document.getElementById('retry-btn').style.display = 'none';
    document.getElementById('skip-btn').style.display = 'none';
    document.getElementById('error-toast').style.display = 'none';
    this.errorInfo = null;

    const step = Steps[this.currentStep];
    if (step && step.onRetry) {
      await step.onRetry();
    }
  },

  skip() {
    document.getElementById('retry-btn').style.display = 'none';
    document.getElementById('skip-btn').style.display = 'none';
    document.getElementById('error-toast').style.display = 'none';
    this.errorInfo = null;
    this.goNext();
  },

  renderStep(stepNum) {
    this.currentStep = stepNum;
    this.updateStepIndicator();
    this.updateButtons();

    const step = Steps[stepNum];
    const container = document.getElementById('step-content');
    if (step && step.render) {
      container.innerHTML = step.render();
    }

    if (step && step.onEnter) {
      step.onEnter();
    }
  },

  updateStepIndicator() {
    document.querySelectorAll('.step').forEach((el) => {
      const s = parseInt(el.dataset.step);
      el.classList.remove('active', 'done', 'error');
      if (s < this.currentStep) el.classList.add('done');
      else if (s === this.currentStep) el.classList.add('active');
    });
  },

  updateButtons() {
    const prevBtn = document.getElementById('prev-btn');
    const nextBtn = document.getElementById('next-btn');
    const retryBtn = document.getElementById('retry-btn');
    const skipBtn = document.getElementById('skip-btn');

    prevBtn.disabled = this.currentStep === 1 || this.isInstalling;
    nextBtn.disabled = this.isInstalling;
    nextBtn.textContent = this.currentStep === this.totalSteps ? '完成' : '下一步';

    if (!this.errorInfo) {
      retryBtn.style.display = 'none';
      skipBtn.style.display = 'none';
    }
  },
};

// Step registry
const Steps = {};

// Init on load
document.addEventListener('DOMContentLoaded', () => AppState.init());
```

- [ ] **Step 4: Commit**

```bash
git add src/renderer/index.html src/renderer/style.css src/renderer/app.js
git commit -m "feat: add renderer shell with wizard state machine and log panel"
```

---

### Task 13: Renderer Step Components

**Files:**
- Create: `src/renderer/steps/step1-check.js`
- Create: `src/renderer/steps/step2-node.js`
- Create: `src/renderer/steps/step3-pnpm.js`
- Create: `src/renderer/steps/step4-cc.js`
- Create: `src/renderer/steps/step5-config.js`

**Interfaces:**
- Consumes: AppState + window.api from Tasks 10, 12
- Produces: 5 个步骤页面的 render/onEnter/onNext/onProgress/onRetry

---

- [ ] **Step 1: Write step1-check.js**

Create `src/renderer/steps/step1-check.js`:

```javascript
Steps[1] = {
  render() {
    return `
      <div class="step-content">
        <div class="step-title">🔍 环境检测</div>
        <div class="status-row" id="node-status">
          <span class="status-icon">⏳</span>
          <span>Node.js: 检测中...</span>
        </div>
        <div class="status-row" id="pnpm-status">
          <span class="status-icon">⏳</span>
          <span>pnpm: 检测中...</span>
        </div>
        <div class="status-row" id="platform-info">
          <span>系统: 检测中...</span>
        </div>
      </div>
    `;
  },

  onEnter() {
    window.api.checkEnv().then((result) => {
      this.updateStatus('node-status', result.node, 'Node.js');
      this.updateStatus('pnpm-status', result.pnpm, 'pnpm');
      document.getElementById('platform-info').innerHTML =
        `<span>系统: ${result.platform === 'darwin' ? 'macOS' : 'Windows'}</span>`;
    });
  },

  updateStatus(elementId, version, name) {
    const el = document.getElementById(elementId);
    if (version) {
      el.innerHTML = `<span class="status-icon ok">✓</span><span>${name}: ${version}</span>`;
    } else {
      el.innerHTML = `<span class="status-icon missing">✗</span><span>${name}: 未安装</span>`;
    }
  },

  onNext() { return true; },
};
```

- [ ] **Step 2: Write step2-node.js**

Create `src/renderer/steps/step2-node.js`:

```javascript
Steps[2] = {
  render() {
    return `
      <div class="step-content">
        <div class="step-title">📦 安装 Node.js</div>
        <div class="progress-bar">
          <div class="progress-fill" id="node-progress"></div>
        </div>
        <div id="node-status-text" style="font-size:13px; color:#aaa;">准备中...</div>
      </div>
    `;
  },

  async onEnter() {
    AppState.isInstalling = true;
    AppState.updateButtons();

    // Check if already installed
    const env = await window.api.checkEnv();
    if (env.node) {
      document.getElementById('node-progress').style.width = '100%';
      document.getElementById('node-status-text').textContent = `Node.js 已安装: ${env.node}`;
      AppState.isInstalling = false;
      AppState.updateButtons();
      return;
    }

    window.api.setCloseGuard('Node.js 安装未完成，确定退出吗？');
    window.api.installNode().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      window.api.clearCloseGuard();

      if (result.success) {
        document.getElementById('node-progress').style.width = '100%';
        document.getElementById('node-status-text').textContent = `Node.js 安装成功: ${result.version}`;
        AppState.goNext();
      }
    });
  },

  onProgress(data) {
    if (data.step === 2) {
      document.getElementById('node-progress').style.width = data.percent + '%';
      document.getElementById('node-status-text').textContent = data.message;
    }
  },

  async onRetry() {
    AppState.isInstalling = true;
    AppState.updateButtons();
    window.api.installNode().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      if (result.success) {
        document.getElementById('node-progress').style.width = '100%';
        document.getElementById('node-status-text').textContent = `Node.js 安装成功: ${result.version}`;
      }
    });
  },
};
```

- [ ] **Step 3: Write step3-pnpm.js**

Create `src/renderer/steps/step3-pnpm.js`:

```javascript
Steps[3] = {
  render() {
    return `
      <div class="step-content">
        <div class="step-title">📦 安装 pnpm</div>
        <div class="progress-bar">
          <div class="progress-fill" id="pnpm-progress"></div>
        </div>
        <div id="pnpm-status-text" style="font-size:13px; color:#aaa;">准备中...</div>
      </div>
    `;
  },

  async onEnter() {
    AppState.isInstalling = true;
    AppState.updateButtons();

    const env = await window.api.checkEnv();
    if (env.pnpm) {
      document.getElementById('pnpm-progress').style.width = '100%';
      document.getElementById('pnpm-status-text').textContent = `pnpm 已安装: ${env.pnpm}`;
      AppState.isInstalling = false;
      AppState.updateButtons();
      return;
    }

    window.api.setCloseGuard('pnpm 安装未完成，确定退出吗？');
    window.api.installPnpm().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      window.api.clearCloseGuard();

      if (result.success) {
        document.getElementById('pnpm-progress').style.width = '100%';
        document.getElementById('pnpm-status-text').textContent = `pnpm 安装成功: ${result.version}`;
        AppState.goNext();
      }
    });
  },

  onProgress(data) {
    if (data.step === 3) {
      document.getElementById('pnpm-progress').style.width = data.percent + '%';
      document.getElementById('pnpm-status-text').textContent = data.message;
    }
  },

  async onRetry() {
    AppState.isInstalling = true;
    AppState.updateButtons();
    window.api.installPnpm().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      if (result.success) {
        document.getElementById('pnpm-progress').style.width = '100%';
        document.getElementById('pnpm-status-text').textContent = `pnpm 安装成功: ${result.version}`;
      }
    });
  },
};
```

- [ ] **Step 4: Write step4-cc.js**

Create `src/renderer/steps/step4-cc.js`:

```javascript
Steps[4] = {
  render() {
    return `
      <div class="step-content">
        <div class="step-title">🚀 安装 Claude Code</div>
        <div class="progress-bar">
          <div class="progress-fill" id="cc-progress"></div>
        </div>
        <div id="cc-status-text" style="font-size:13px; color:#aaa;">准备中...</div>
      </div>
    `;
  },

  async onEnter() {
    AppState.isInstalling = true;
    AppState.updateButtons();
    window.api.setCloseGuard('Claude Code 安装未完成，确定退出吗？');

    window.api.installClaudeCode().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      window.api.clearCloseGuard();

      if (result.success) {
        document.getElementById('cc-progress').style.width = '100%';
        document.getElementById('cc-status-text').textContent = `Claude Code 安装成功: ${result.version}`;
        AppState.goNext();
      }
    });
  },

  onProgress(data) {
    if (data.step === 4) {
      document.getElementById('cc-progress').style.width = data.percent + '%';
      document.getElementById('cc-status-text').textContent = data.message;
    }
  },

  async onRetry() {
    AppState.isInstalling = true;
    AppState.updateButtons();
    window.api.installClaudeCode().then((result) => {
      AppState.isInstalling = false;
      AppState.updateButtons();
      if (result.success) {
        document.getElementById('cc-progress').style.width = '100%';
        document.getElementById('cc-status-text').textContent = `Claude Code 安装成功: ${result.version}`;
      }
    });
  },
};
```

- [ ] **Step 5: Write step5-config.js**

Create `src/renderer/steps/step5-config.js`:

```javascript
Steps[5] = {
  render() {
    return `
      <div class="step-content">
        <div class="step-title">⚙️ 配置 DeepSeek V4</div>
        <div class="form-group">
          <label>DeepSeek API Key <span style="color:#ef5350">*</span></label>
          <input type="password" id="api-key-input" placeholder="sk-..." autocomplete="off">
        </div>
        <div class="form-group">
          <label>API Base URL (可选)</label>
          <input type="text" id="base-url-input" placeholder="https://api.deepseek.com">
        </div>
        <div id="config-result" style="font-size:13px; margin-top:12px;"></div>
      </div>
    `;
  },

  async onNext() {
    const apiKey = document.getElementById('api-key-input').value.trim();
    const baseUrl = document.getElementById('base-url-input').value.trim() || undefined;

    const result = await window.api.generateConfig(apiKey, baseUrl);
    const resultEl = document.getElementById('config-result');

    if (result.success) {
      resultEl.innerHTML = `<span style="color:#66bb6a;">✓ ${result.message}</span>`;
      return true;
    } else {
      resultEl.innerHTML = `<span style="color:#ef5350;">✗ ${result.message}</span>`;
      return false;
    }
  },
};
```

- [ ] **Step 6: Commit**

```bash
git add src/renderer/steps/
git commit -m "feat: add all 5 wizard step components"
```

---

### Task 14: Build & Packaging

**Files:**
- Create: `scripts/build.ts`
- Modify: `package.json` (verify scripts)
- Modify: `electron-builder.yml` (verify/finalize)

**Interfaces:**
- Consumes: Complete app from Tasks 1–13
- Produces: 可构建并打包为 .dmg / .exe / .zip

---

- [ ] **Step 1: Write build script**

Create `scripts/build.ts` (replacing placeholder):

```typescript
import { execSync } from 'child_process';

function run(cmd: string): void {
  console.log(`\n> ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });
}

const platform = process.argv[2] || process.platform;

console.log(`Building for: ${platform}`);

// Clean
run('rm -rf dist release');

// Compile TypeScript
run('npx tsc');

// Copy renderer files (not compiled, just copied)
run('mkdir -p dist/renderer/steps');
run('cp src/renderer/index.html dist/renderer/');
run('cp src/renderer/style.css dist/renderer/');
run('cp src/renderer/app.js dist/renderer/');
run('cp src/renderer/steps/*.js dist/renderer/steps/');

// Package
run(`npx electron-builder --${platform === 'darwin' ? 'mac' : 'win'}`);

console.log('\n✅ Build complete!');
console.log('Output in: release/');
```

- [ ] **Step 2: Verify TypeScript compilation**

Run: `npx tsc`
Expected: Compilation succeeds, dist/ populated with compiled JS

- [ ] **Step 3: Test dev run** (manual verification)

Run: `pnpm dev`
Expected: Electron window opens with the wizard UI

- [ ] **Step 4: Verify app functionality checklist**

- [ ] Window opens with step indicator showing 5 steps
- [ ] Step 1 shows environment check results
- [ ] Step 2–4 show progress bar
- [ ] Log panel displays messages
- [ ] Export logs button opens save dialog
- [ ] Close during install shows confirmation dialog
- [ ] Step 5 shows API key form with save

- [ ] **Step 5: Commit**

```bash
git add scripts/build.ts package.json electron-builder.yml
git commit -m "build: add build script and finalize packaging config"
```

---

## Completion Checklist

- [ ] All 14 tasks implemented
- [ ] `pnpm test` passes all unit tests
- [ ] `pnpm dev` launches the Electron app
- [ ] App wizard completes successfully on macOS
- [ ] `pnpm build mac` produces .dmg and .zip
- [ ] Windows build produces .exe and .zip (requires Windows environment)
