import { getOSInfo, checkClaudeCodeCompatibility } from '../utils/platform';
import { join } from 'path';

export async function installClaudeCode(
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>,
  onProgress: (percent: number, message: string) => void,
  onLog: (text: string) => void
): Promise<{ success: boolean; version: string; warning?: string }> {
  // Log OS info and check compatibility
  const osInfo = getOSInfo();
  const isWindows = osInfo.platform === 'win32';
  onLog(`操作系统: ${osInfo.name} (${osInfo.arch})`);
  onLog(`系统版本: ${osInfo.version}`);

  const compat = checkClaudeCodeCompatibility();
  if (compat.warning) {
    onLog(`⚠ 兼容性警告:`);
    compat.warning.split('\n').forEach((line) => onLog(`  ${line}`));
  }

  // Windows: use npm (official recommendation); macOS: use pnpm
  const installCmd = isWindows ? 'npm' : 'pnpm';
  const installArgs = isWindows
    ? ['install', '-g', '--registry', 'https://registry.npmmirror.com', '@anthropic-ai/claude-code']
    : ['install', '-g', '@anthropic-ai/claude-code'];

  onLog('开始安装 Claude Code...');
  onLog(`执行: ${installCmd} ${installArgs.join(' ')}`);
  onProgress(10, `正在通过 ${installCmd} 安装 Claude Code（可能需要几分钟）...`);

  const installResult = await runCommand(installCmd, installArgs);

  if (installResult.stdout.trim()) {
    onLog(`安装输出: ${installResult.stdout.trim()}`);
  }

  if (installResult.exitCode !== 0) {
    onLog(`安装失败，${installCmd} 退出码: ${installResult.exitCode}`);
    if (installResult.stderr.trim()) {
      onLog(`错误详情: ${installResult.stderr.trim()}`);
    }
    return { success: false, version: '' };
  }

  onLog(`${installCmd} 安装命令执行成功`);

  // Find the actual claude binary location and add to PATH on Windows
  let claudeBin = 'claude';
  if (isWindows) {
    const npmPrefix = await runCommand('npm', ['prefix', '-g']);
    if (npmPrefix.exitCode === 0) {
      const npmDir = npmPrefix.stdout.trim();
      claudeBin = join(npmDir, 'claude.cmd');
      onLog(`Claude Code 安装位置: ${npmDir}`);

      // Add npm global bin to user PATH — always write, don't guess
      onLog('正在配置系统 PATH...');
      // Read registry PATH first
      const regResult = await runCommand('reg', [
        'query', 'HKCU\\Environment',
        '/v', 'Path',
      ]);
      let existingUserPath = '';
      if (regResult.exitCode === 0) {
        const match = regResult.stdout.match(/Path\s+REG_\w+\s+(.+)/);
        if (match) existingUserPath = match[1].trim();
      }

      // Always use the npmDir in PATH — if already present, setx is harmless
      // Use the raw directory path (not %VAR%) for reliability
      const newPath = existingUserPath
        ? `${existingUserPath};${npmDir}`
        : npmDir;
      onLog(`写入用户 PATH: ${npmDir}`);
      const setxResult = await runCommand('setx', ['Path', newPath]);
      if (setxResult.exitCode === 0) {
        onLog('已添加到用户 PATH（新命令行窗口生效）');
        // Also update current process PATH so verification works immediately
        process.env.PATH = `${process.env.PATH};${npmDir}`;
      } else {
        onLog(`PATH 写入失败: ${setxResult.stderr}`);
      }
    }
  }

  onProgress(80, '正在验证安装结果...');

  // Try to detect the installed version
  let version = '';
  let claudeError = '';

  // Try direct claude command first
  let verify = await runCommand('claude', ['--version']);
  if (verify.exitCode !== 0 && isWindows) {
    // On Windows, claude might not be in PATH — try full path
    verify = await runCommand(claudeBin, ['--version']);
  }

  if (verify.exitCode === 0 && verify.stdout.trim()) {
    version = verify.stdout.trim();
    onLog(`检测到版本: ${version}`);
  } else {
    if (verify.stderr.trim()) {
      claudeError += verify.stderr.trim();
      onLog(`版本检查输出: ${verify.stderr.trim()}`);
    }
    if (verify.stdout.trim()) {
      claudeError += ' ' + verify.stdout.trim();
    }

    // Try --help as fallback
    let help = await runCommand('claude', ['--help']);
    if (help.exitCode !== 0 && isWindows) {
      help = await runCommand(claudeBin, ['--help']);
    }
    if (help.exitCode === 0) {
      onLog('Claude Code 可正常执行');
    } else if (help.stderr.trim()) {
      claudeError += '\n' + help.stderr.trim();
    }

    const verMatch = claudeError.match(/(\d+\.\d+\.\d+)/);
    if (verMatch) {
      version = verMatch[1];
      onLog(`检测到版本: ${version}`);
    }
  }

  // Check error type
  const isNotFound = claudeError.includes('找不到') || claudeError.includes('not found') || claudeError.includes('not recognized');
  const isWinCompatError = claudeError.includes('不兼容') || claudeError.includes('incompatible');
  const isPathIssue = isWindows && isNotFound;

  if (version) {
    onLog(`Claude Code ${version} 安装成功 ✓`);
    onProgress(100, `Claude Code ${version} 安装成功 ✓`);
  } else {
    onLog('Claude Code 安装完成（文件已安装）');

    if (isPathIssue) {
      onLog('=================================================================');
      onLog('  ⚠ claude 命令未在系统 PATH 中找到');
      onLog('  解决方法 — 将以下路径添加到系统环境变量 PATH 中:');
      onLog(`  %APPDATA%\\npm`);
      onLog('  步骤: 设置 → 系统 → 关于 → 高级系统设置 → 环境变量');
      onLog('  在 "用户变量" 中找到 Path，添加: %APPDATA%\\npm');
      onLog('  然后重新打开命令行窗口即可使用 claude 命令');
      onLog('=================================================================');
    } else if (isWinCompatError) {
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

  let warning: string | undefined;
  if (isPathIssue) {
    warning = 'claude 命令未在 PATH 中。请将 %APPDATA%\\npm 添加到系统环境变量 Path 中，然后重新打开命令行。';
  } else if (isWinCompatError) {
    warning = 'Claude Code 不支持 Windows 10。请升级到 Windows 11 或使用 WSL2。';
  } else if (compat.warning) {
    warning = compat.warning;
  }

  return { success: true, version: version || 'installed', warning };
}
