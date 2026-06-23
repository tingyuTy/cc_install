import { join } from 'path';
import { tmpdir } from 'os';
import { get } from 'https';
import { getNodeDownloadUrl, getNodeInstallCommand, getPlatform } from '../utils/platform';

export async function installNode(
  downloadFile: (url: string, dest: string, onProgress?: (p: number, d: number, t: number) => void) => Promise<void>,
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>,
  onProgress: (percent: number, message: string) => void,
  onLog: (text: string) => void
): Promise<{ success: boolean; version: string }> {
  // Check existing
  const existing = await runCommand('node', ['-v']);
  if (existing.exitCode === 0 && existing.stdout.trim()) {
    const version = existing.stdout.trim();
    onLog(`Node.js 已安装: ${version}`);
    onProgress(100, `Node.js 已安装: ${version}`);
    return { success: true, version };
  }

  onLog('Node.js 未安装，开始安装...');
  onProgress(0, '正在获取最新版本号...');

  // Fetch latest version
  const version = await fetchLatestNodeVersion();
  onLog(`最新版本: ${version}`);
  const downloadUrl = getNodeDownloadUrl(version);
  const ext = getPlatform() === 'darwin' ? 'pkg' : 'msi';
  const pkgPath = join(tmpdir(), `node-${version}-${Date.now()}.${ext}`);

  onProgress(5, '正在下载 Node.js...');
  await downloadFile(downloadUrl, pkgPath, (percent) => {
    onProgress(5 + Math.round(percent * 0.7), `下载中: ${percent}%`);
  });

  // Install
  onProgress(75, '正在安装 Node.js...');
  const installCmd = getNodeInstallCommand(pkgPath);
  const installResult = await runCommand(installCmd.cmd, installCmd.args);

  if (installResult.exitCode !== 0) {
    onLog(`安装失败: ${installResult.stderr}`);
    return { success: false, version: '' };
  }

  // Verify
  onProgress(95, '正在验证安装...');
  const verify = await runCommand('node', ['-v']);
  if (verify.exitCode === 0 && verify.stdout.trim()) {
    const v = verify.stdout.trim();
    onLog(`Node.js 安装成功: ${v}`);
    onProgress(100, `Node.js ${v} 安装成功 ✓`);
    return { success: true, version: v };
  }

  onLog('Node.js 安装后验证失败');
  return { success: false, version: '' };
}

function fetchLatestNodeVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    get('https://nodejs.org/dist/latest/SHASUMS256.txt', (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const redirect = res.headers.location;
        if (redirect) {
          fetchLatestNodeVersionFromUrl(redirect).then(resolve, reject);
          return;
        }
      }
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => {
        const match = data.match(/node-(v\d+\.\d+\.\d+)/);
        if (match) {
          resolve(match[1]);
        } else {
          reject(new Error('无法解析最新 Node.js 版本号'));
        }
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}

function fetchLatestNodeVersionFromUrl(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      let data = '';
      res.on('data', (chunk: Buffer) => { data += chunk.toString(); });
      res.on('end', () => {
        const match = data.match(/node-(v\d+\.\d+\.\d+)/);
        if (match) resolve(match[1]);
        else reject(new Error('无法解析最新 Node.js 版本号'));
      });
      res.on('error', reject);
    }).on('error', reject);
  });
}
