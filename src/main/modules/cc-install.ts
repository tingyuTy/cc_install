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

  // --version might not be supported, try --help
  const which = await runCommand('claude', ['--help']);
  if (which.exitCode === 0) {
    onLog('Claude Code 安装成功');
    onProgress(100, 'Claude Code 安装成功 ✓');
    return { success: true, version: 'unknown' };
  }

  onLog('Claude Code 安装后验证失败');
  return { success: false, version: '' };
}
