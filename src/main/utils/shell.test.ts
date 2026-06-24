import { describe, it, expect } from 'vitest';
import { createRunCommand } from './shell';
import { GlobalLogger } from '../logger';

// Test without shell to avoid quoting issues; real usage passes useShell=true
describe('shell utils', () => {
  it('should execute a command and return stdout', async () => {
    const logger = new GlobalLogger();
    const runCommand = createRunCommand(logger, false);
    const result = await runCommand('node', ['-e', 'process.stdout.write("hello")']);
    expect(result.stdout.trim()).toBe('hello');
    expect(result.exitCode).toBe(0);
  });

  it('should capture stderr', async () => {
    const logger = new GlobalLogger();
    const runCommand = createRunCommand(logger, false);
    const result = await runCommand('node', ['-e', 'process.stderr.write("err msg")']);
    expect(result.stderr.trim()).toBe('err msg');
    expect(result.exitCode).toBe(0);
  });

  it('should report non-zero exit codes', async () => {
    const logger = new GlobalLogger();
    const runCommand = createRunCommand(logger, false);
    const result = await runCommand('node', ['-e', 'process.exit(1)']);
    expect(result.exitCode).toBe(1);
  });

  it('should log executed commands to logger', async () => {
    const logger = new GlobalLogger();
    const runCommand = createRunCommand(logger, false);
    await runCommand('node', ['-e', 'console.log("test")']);
    const logs = logger.getLogs();
    const hasCommandLog = logs.some((l) =>
      l.text.includes('执行命令:') && l.text.includes('node')
    );
    expect(hasCommandLog).toBe(true);
  });
});
