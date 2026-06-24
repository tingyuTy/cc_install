import { dialog, BrowserWindow, shell } from 'electron';
import { spawn } from 'child_process';
import { getPlatform } from '../utils/platform';

/** Let user pick a workspace folder */
export async function pickWorkspaceFolder(): Promise<string | null> {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return null;

  const result = await dialog.showOpenDialog(win, {
    title: '选择工作区文件夹',
    properties: ['openDirectory'],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  return result.filePaths[0];
}

/** Open a new terminal window and run `claude` in the given folder */
export function openTerminalWithClaude(workspaceFolder: string): void {
  const platform = getPlatform();
  const cwd = workspaceFolder;

  if (platform === 'win32') {
    // Windows: open cmd and run claude
    spawn('cmd', ['/k', `cd /d "${cwd}" && claude`], {
      detached: true,
      stdio: 'ignore',
      cwd,
    }).unref();
  } else {
    // macOS: use osascript to tell Terminal to run claude
    const script = `
      tell application "Terminal"
        activate
        do script "cd ${escapeAppleScript(cwd)} && claude"
      end tell
    `;
    spawn('osascript', ['-e', script], {
      detached: true,
      stdio: 'ignore',
    }).unref();
  }
}

function escapeAppleScript(path: string): string {
  return path.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}
