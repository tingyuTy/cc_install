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
