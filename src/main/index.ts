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
