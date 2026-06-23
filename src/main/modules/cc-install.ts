export async function installClaudeCode(
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>,
  onProgress: (percent: number, message: string) => void,
  onLog: (text: string) => void
): Promise<{ success: boolean; version: string }> {
  onLog('开始安装 Claude Code...');
  onLog('执行: pnpm install -g @anthropic-ai/claude-code');
  onProgress(10, '正在通过 pnpm 安装 Claude Code（可能需要几分钟）...');

  const installResult = await runCommand('pnpm', [
    'install',
    '-g',
    '@anthropic-ai/claude-code',
  ]);

  // Log stdout/stderr summary
  if (installResult.stdout.trim()) {
    onLog(`安装输出: ${installResult.stdout.trim()}`);
  }

  if (installResult.exitCode !== 0) {
    onLog(`安装失败，pnpm 退出码: ${installResult.exitCode}`);
    if (installResult.stderr.trim()) {
      onLog(`错误详情: ${installResult.stderr.trim()}`);
    }
    return { success: false, version: '' };
  }

  onLog('pnpm 安装命令执行成功');
  onProgress(80, '正在验证安装结果...');

  // Try to detect the installed version
  let version = '';
  const verify = await runCommand('claude', ['--version']);
  if (verify.exitCode === 0 && verify.stdout.trim()) {
    version = verify.stdout.trim();
    onLog(`检测到版本: ${version}`);
  } else if (verify.stderr.trim()) {
    // On Windows, --version may print to stderr or show compatibility warning
    const verMatch = verify.stderr.match(/(\d+\.\d+\.\d+)/);
    if (verMatch) {
      version = verMatch[1];
      onLog(`检测到版本: ${version}`);
    }
    // Log the stderr as it may contain useful info (e.g. compatibility notes)
    if (verify.stderr.trim()) {
      onLog(`版本检查输出: ${verify.stderr.trim()}`);
    }
  }

  // pnpm install succeeded = Claude Code is installed, regardless of version check
  if (version) {
    onLog(`Claude Code ${version} 安装成功 ✓`);
    onProgress(100, `Claude Code ${version} 安装成功 ✓`);
  } else {
    onLog('Claude Code 安装成功（版本信息未能检测，可能是系统兼容性问题）');
    onProgress(100, 'Claude Code 安装成功 ✓');
  }

  return { success: true, version: version || 'installed' };
}
