import { describe, it, expect } from 'vitest';
import { installPnpm } from './pnpm-install';
import { GlobalLogger } from '../logger';

describe('pnpm-install', () => {
  const logger = new GlobalLogger();

  function makeRunCommand(outputs: Array<{ stdout: string; exitCode: number }>) {
    let callIndex = 0;
    return async (_cmd: string, _args: string[]) => {
      const output = outputs[callIndex] || outputs[outputs.length - 1];
      callIndex++;
      return { stdout: output.stdout, stderr: '', exitCode: output.exitCode };
    };
  }

  it('should skip install if pnpm is already present', async () => {
    const runCommand = makeRunCommand([
      { stdout: '9.0.0', exitCode: 0 }, // check pnpm
    ]);

    const result = await installPnpm(runCommand, () => {}, (t: string) => logger.log(t));
    expect(result.success).toBe(true);
    expect(result.version).toBe('9.0.0');
    expect(logger.getLogs().some((l) => l.text.includes('pnpm 已安装'))).toBe(true);
  });

  it('should install pnpm if not present', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 1 },        // check pnpm (not found)
      { stdout: '', exitCode: 0 },        // npm install -g pnpm
      { stdout: '9.0.0', exitCode: 0 },   // verify
    ]);

    const result = await installPnpm(runCommand, () => {}, (t: string) => logger.log(t));
    expect(result.success).toBe(true);
    expect(result.version).toBe('9.0.0');
  });

  it('should fail if pnpm verification fails', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 1 },        // check pnpm (not found)
      { stdout: '', exitCode: 0 },        // npm install -g pnpm
      { stdout: '', exitCode: 1 },        // verify fails
    ]);

    const result = await installPnpm(runCommand, () => {}, (t: string) => logger.log(t));
    expect(result.success).toBe(false);
  });
});
