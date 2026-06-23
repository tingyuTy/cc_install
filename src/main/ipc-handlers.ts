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
    const sendProgress = (percent: number, message: string) => {
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
