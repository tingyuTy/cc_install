import { app, BrowserWindow, dialog, nativeImage } from 'electron';
import { join } from 'path';
import { existsSync } from 'fs';
import { GlobalLogger } from './logger';
import { registerIpcHandlers, getCloseGuardMessage } from './ipc-handlers';

const logger = new GlobalLogger();

function setAppIcon(): void {
  // Dev: assets/icon.png relative to project root
  // Packaged: inside app resources
  const devPath = join(__dirname, '../../assets/icon.png');
  const pkgPath = join(process.resourcesPath || '', 'assets/icon.png');
  const iconPath = existsSync(devPath) ? devPath : pkgPath;

  if (!existsSync(iconPath)) return;

  const icon = nativeImage.createFromPath(iconPath);

  // macOS Dock icon
  if (process.platform === 'darwin' && app.dock) {
    app.dock.setIcon(icon);
  }
}

function createWindow(): void {
  const win = new BrowserWindow({
    width: 720,
    height: 580,
    resizable: false,
    title: 'Claude Code Installer',
    icon: join(__dirname, '../../assets/icon.png'),
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
  setAppIcon();
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
