export async function uninstallClaudeCode(
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>,
  onProgress: (percent: number, message: string) => void,
  onLog: (text: string) => void
): Promise<{ success: boolean; message: string }> {
  onLog('开始卸载 Claude Code...');
  onLog('执行: pnpm uninstall -g @anthropic-ai/claude-code');
  onProgress(20, '正在卸载 Claude Code...');

  const result = await runCommand('pnpm', [
    'uninstall',
    '-g',
    '@anthropic-ai/claude-code',
  ]);

  if (result.stdout.trim()) {
    onLog(result.stdout.trim());
  }

  if (result.exitCode !== 0) {
    const msg = `卸载失败，pnpm 退出码: ${result.exitCode}`;
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
