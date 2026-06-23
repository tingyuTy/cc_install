export function getPlatform(): 'darwin' | 'win32' {
  const p = process.platform;
  if (p === 'darwin' || p === 'win32') return p;
  throw new Error(`Unsupported platform: ${p}`);
}

export function getNodeDownloadUrl(version: string): string {
  const platform = getPlatform();
  const ext = platform === 'darwin' ? 'pkg' : 'msi';
  const osName = platform === 'darwin' ? 'darwin' : 'win';
  return `https://nodejs.org/dist/${version}/node-${version}-${osName}-x64.${ext}`;
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
