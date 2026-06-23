import { describe, it, expect } from 'vitest';
import { installClaudeCode } from './cc-install';
import { GlobalLogger } from '../logger';

describe('cc-install', () => {
  const logger = new GlobalLogger();

  function makeRunCommand(outputs: Array<{ stdout: string; stderr?: string; exitCode: number }>) {
    let callIndex = 0;
    return async (_cmd: string, _args: string[]) => {
      const output = outputs[callIndex] || outputs[outputs.length - 1];
      callIndex++;
      return { stdout: output.stdout, stderr: output.stderr || '', exitCode: output.exitCode };
    };
  }

  it('should install Claude Code via pnpm', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 0 },               // pnpm install
      { stdout: '1.0.0', exitCode: 0 },           // verify
    ]);

    const progressCalls: Array<{ percent: number; message: string }> = [];
    const result = await installClaudeCode(runCommand, (p, m) => progressCalls.push({ percent: p, message: m }), (t: string) => logger.log(t));
    expect(result.success).toBe(true);
    expect(result.version).toBe('1.0.0');
  });

  it('should fail if install command fails', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 1 },               // pnpm install fails
    ]);

    const result = await installClaudeCode(runCommand, () => {}, (t: string) => logger.log(t));
    expect(result.success).toBe(false);
  });

  it('should succeed even if version check fails after install', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 0 },               // pnpm install succeeds
      { stdout: '', exitCode: 1, stderr: 'incompatible Windows version' },  // verify fails
    ]);

    const result = await installClaudeCode(runCommand, () => {}, (t: string) => logger.log(t));
    expect(result.success).toBe(true);
    expect(result.version).toBe('installed');
  });

  it('should report progress during install', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 0 },               // pnpm install
      { stdout: '1.0.0', exitCode: 0 },           // verify
    ]);

    const progressMessages: string[] = [];
    await installClaudeCode(runCommand, (_p, m) => progressMessages.push(m), (t: string) => logger.log(t));
    expect(progressMessages.length).toBeGreaterThan(0);
    expect(progressMessages.some((m) => m.includes('安装'))).toBe(true);
    expect(progressMessages.some((m) => m.includes('验证'))).toBe(true);
  });
});
