import { release } from 'os';

export function getPlatform(): 'darwin' | 'win32' {
  const p = process.platform;
  if (p === 'darwin' || p === 'win32') return p;
  throw new Error(`Unsupported platform: ${p}`);
}

/** Get OS info for compatibility checking */
export function getOSInfo(): { platform: string; version: string; build: number; name: string; arch: string } {
  const platform = getPlatform();
  const version = release();
  const arch = getArch();
  let build = 0;
  let name = platform === 'darwin' ? 'macOS' : 'Windows';

  if (platform === 'win32') {
    // os.release() returns "10.0.19045" on Windows
    const parts = version.split('.');
    build = parseInt(parts[2] || '0', 10);
    if (build >= 22000) name = `Windows 11 (build ${build})`;
    else if (build >= 19041) name = `Windows 10 (build ${build})`;
    else name = `Windows (build ${build})`;
  }

  return { platform, version, build, name, arch };
}

/**
 * Check Claude Code compatibility on Windows.
 * Claude Code 2.x requires Windows 11 (build 22000+) or Windows 10 21H2+.
 * Returns null if compatible, or a warning message if potentially incompatible.
 */
export function checkClaudeCodeCompatibility(): { compatible: boolean; warning: string | null } {
  const info = getOSInfo();
  if (info.platform === 'darwin') {
    return { compatible: true, warning: null };
  }

  // Windows: Claude Code 2.x may not work on older builds
  if (info.build === 0) {
    return { compatible: true, warning: null }; // Can't detect, assume OK
  }

  if (info.build < 22000) {
    return {
      compatible: false,
      warning: [
        `检测到系统: ${info.name}`,
        `Claude Code 最新版本可能需要 Windows 11 才能运行。`,
        `建议升级到 Windows 11，或使用 WSL (Windows Subsystem for Linux) 安装 Claude Code。`,
        `你仍然可以继续安装，但 Claude Code 可能无法正常启动。`,
      ].join('\n'),
    };
  }

  return { compatible: true, warning: null };
}

/** Get CPU architecture for Node.js download */
export function getArch(): string {
  // process.arch: 'x64', 'arm64', 'ia32'
  const arch = process.arch;
  if (arch === 'arm64') return 'arm64';
  if (arch === 'x64') return 'x64';
  return 'x86'; // ia32 or other 32-bit
}

export function getNodeDownloadUrl(version: string): string {
  const platform = getPlatform();
  const arch = getArch();
  const ext = platform === 'darwin' ? 'pkg' : 'msi';
  const osName = platform === 'darwin' ? 'darwin' : 'win';
  return `https://nodejs.org/dist/${version}/node-${version}-${osName}-${arch}.${ext}`;
}

export function getNodeInstallCommand(pkgPath: string): {
  cmd: string;
  args: string[];
  useSudo: boolean;
} {
  const platform = getPlatform();
  if (platform === 'darwin') {
    return {
      cmd: 'sudo',
      args: ['installer', '-pkg', pkgPath, '-target', '/'],
      useSudo: true,
    };
  }
  return {
    cmd: 'msiexec',
    args: ['/i', pkgPath, '/quiet'],
    useSudo: false,
  };
}

export function getDefaultShell(): string {
  return getPlatform() === 'darwin' ? '/bin/zsh' : 'cmd.exe';
}
