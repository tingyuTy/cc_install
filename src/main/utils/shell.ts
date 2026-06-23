import { spawn } from 'child_process';
import { GlobalLogger } from '../logger';

export interface RunCommandResult {
  stdout: string;
  stderr: string;
  exitCode: number;
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
        const text = data.toString();
        stdout += text;
        text.split('\n').filter(Boolean).forEach((line) => logger.log(line));
      });

      child.stderr.on('data', (data: Buffer) => {
        const text = data.toString();
        stderr += text;
        text.split('\n').filter(Boolean).forEach((line) => logger.log(line));
      });

      child.on('close', (code) => {
        const exitCode = code ?? 1;
        logger.log(`命令完成，退出码: ${exitCode}`);
        resolve({ stdout, stderr, exitCode });
      });

      child.on('error', (err) => {
        logger.log(`命令执行失败: ${err.message}`);
        resolve({ stdout, stderr: err.message, exitCode: 1 });
      });
    });
  };
}
