import { getPlatform } from '../utils/platform';

export async function uninstallClaudeCode(
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>,
  onProgress: (percent: number, message: string) => void,
  onLog: (text: string) => void
): Promise<{ success: boolean; message: string }> {
  const isWindows = getPlatform() === 'win32';
  const cmd = isWindows ? 'npm' : 'pnpm';

  onLog('开始卸载 Claude Code...');
  onLog(`执行: ${cmd} uninstall -g @anthropic-ai/claude-code`);
  onProgress(20, '正在卸载 Claude Code...');

  const result = await runCommand(cmd, [
    'uninstall',
    '-g',
    '@anthropic-ai/claude-code',
  ]);

  if (result.stdout.trim()) {
    onLog(result.stdout.trim());
  }

  if (result.exitCode !== 0) {
    const msg = `卸载失败，${cmd} 退出码: ${result.exitCode}`;
    onLog(msg);
    if (result.stderr.trim()) {
      onLog(`错误详情: ${result.stderr.trim()}`);
    }
    return { success: false, message: msg };
  }

  onLog('Claude Code 已成功卸载');
  onProgress(100, 'Claude Code 卸载完成 ✓');
  return { success: true, message: 'Claude Code 已成功卸载' };
}
