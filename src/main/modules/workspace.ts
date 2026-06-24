import { dialog, BrowserWindow } from 'electron';
import { spawn, exec } from 'child_process';
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
export function openTerminalWithClaude(workspaceFolder: string): { success: boolean; error?: string } {
  const platform = getPlatform();
  const cwd = workspaceFolder;

  try {
    if (platform === 'win32') {
      // Windows: use start to open a new cmd window
      const cmd = `start "Claude Code" cmd /k "cd /d ${cwd} && claude"`;
      exec(cmd, { cwd }, (err) => {
        if (err) console.error('Failed to open terminal:', err.message);
      });
    } else {
      // macOS: open Terminal and run claude
      const escaped = cwd.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      const script = `tell application "Terminal" to do script "cd \\"${escaped}\\" && claude"`;
      const child = spawn('osascript', ['-e', script], {
        detached: true,
        stdio: 'ignore',
      });
      child.unref();
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}
