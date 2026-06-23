import { spawn } from 'child_process';
import { GlobalLogger } from '../logger';

export interface RunCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
}

// Windows CJK consoles may output GBK; try UTF-8 first, fall back to common CJK encodings
function decodeBuffer(buf: Buffer): string {
  const utf8 = buf.toString('utf-8');
  // Quick check: if it contains replacement chars, try GBK
  if (utf8.includes('�')) {
    try { return (buf as any).toString('gbk'); } catch (_) { /* ignore */ }
  }
  return utf8;
}

export function createRunCommand(logger: GlobalLogger) {
  return function runCommand(
    cmd: string,
    args: string[],
    opts?: { cwd?: string }
  ): Promise<RunCommandResult> {
    const commandStr = `${cmd} ${args.join(' ')}`;
    logger.log(`执行命令: ${commandStr}`);

    return new Promise((resolve) => {
      const child = spawn(cmd, args, {
        cwd: opts?.cwd,
        shell: process.platform === 'win32',
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data: Buffer) => {
        const text = decodeBuffer(data);
        stdout += text;
        if (text.trim()) logger.log(text.trim());
      });

      child.stderr.on('data', (data: Buffer) => {
        const text = decodeBuffer(data);
        stderr += text;
        if (text.trim()) logger.log(text.trim());
      });

      child.on('close', (code) => {
        const exitCode = code ?? 1;
        const status = exitCode === 0 ? '成功' : '失败';
        logger.log(`命令完成，退出码: ${exitCode} (${status})`);
        resolve({ stdout, stderr, exitCode });
      });

      child.on('error', (err) => {
        logger.log(`命令执行失败: ${err.message}`);
        resolve({ stdout, stderr: err.message, exitCode: 1 });
      });
    });
  };
}
