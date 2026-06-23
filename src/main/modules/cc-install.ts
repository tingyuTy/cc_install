import { getOSInfo, checkClaudeCodeCompatibility } from '../utils/platform';

export async function installClaudeCode(
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>,
  onProgress: (percent: number, message: string) => void,
  onLog: (text: string) => void
): Promise<{ success: boolean; version: string; warning?: string }> {
  // Log OS info and check compatibility
  const osInfo = getOSInfo();
  onLog(`操作系统: ${osInfo.name} (${osInfo.arch})`);
  onLog(`系统版本: ${osInfo.version}`);

  const compat = checkClaudeCodeCompatibility();
  if (compat.warning) {
    onLog(`⚠ 兼容性警告:`);
    compat.warning.split('\n').forEach((line) => onLog(`  ${line}`));
  }

  // Windows: use npm (official recommendation); macOS: use pnpm
  const isWindows = osInfo.platform === 'win32';
  const installCmd = isWindows ? 'npm' : 'pnpm';
  const installArgs = isWindows
    ? ['install', '-g', '--registry', 'https://registry.npmmirror.com', '@anthropic-ai/claude-code']
    : ['install', '-g', '@anthropic-ai/claude-code'];

  onLog('开始安装 Claude Code...');
  onLog(`执行: ${installCmd} ${installArgs.join(' ')}`);
  onProgress(10, `正在通过 ${installCmd} 安装 Claude Code（可能需要几分钟）...`);

  const installResult = await runCommand(installCmd, installArgs);

  // Log stdout summary
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

  onLog(`${installCmd} 安装命令执行成功`);
  onProgress(80, '正在验证安装结果...');

  // Try to detect the installed version
  let version = '';
  let claudeError = '';
  const verify = await runCommand('claude', ['--version']);
  if (verify.exitCode === 0 && verify.stdout.trim()) {
    version = verify.stdout.trim();
    onLog(`检测到版本: ${version}`);
  } else {
    // Collect any error info
    if (verify.stderr.trim()) {
      claudeError += verify.stderr.trim();
      onLog(`版本检查输出: ${verify.stderr.trim()}`);
    }
    if (verify.stdout.trim()) {
      claudeError += ' ' + verify.stdout.trim();
    }

    // Try --help as fallback
    const help = await runCommand('claude', ['--help']);
    if (help.exitCode === 0) {
      onLog('Claude Code 可正常执行');
    } else if (help.stderr.trim()) {
      claudeError += '\n' + help.stderr.trim();
    }

    // Check if version in stderr
    const verMatch = claudeError.match(/(\d+\.\d+\.\d+)/);
    if (verMatch) {
      version = verMatch[1];
      onLog(`检测到版本: ${version}`);
    }
  }

  // Check if the error indicates OS incompatibility (Windows)
  const isWinCompatError = claudeError.includes('不兼容') || claudeError.includes('incompatible');

  // Build result message
  if (version) {
    onLog(`Claude Code ${version} 安装成功 ✓`);
    onProgress(100, `Claude Code ${version} 安装成功 ✓`);
  } else {
    onLog('Claude Code 安装完成（文件已安装）');
    if (isWinCompatError) {
      onLog('=================================================================');
      onLog('  ⚠ Claude Code 当前版本不支持 Windows 10');
      onLog('  该二进制文件需要 Windows 11 才能运行。');
      onLog('  解决方案：');
      onLog('  1. 升级到 Windows 11');
      onLog('  2. 安装 WSL2 (Windows Subsystem for Linux)');
      onLog('     管理员 PowerShell 运行: wsl --install');
      onLog('     然后在 WSL 终端中运行: npm install -g @anthropic-ai/claude-code');
      onLog('=================================================================');
    } else if (claudeError) {
      onLog('注意: Claude Code 可能无法在当前系统上运行');
      onLog('请确认你的系统满足 Claude Code 的运行要求');
    }
    onProgress(100, 'Claude Code 安装完成 ✓');
  }

  return {
    success: true,
    version: version || 'installed',
    warning: isWinCompatError
      ? 'Claude Code 不支持 Windows 10。请升级到 Windows 11 或使用 WSL2。'
      : (compat.warning || undefined),
  };
}
