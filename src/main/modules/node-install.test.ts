import { describe, it, expect, beforeEach } from 'vitest';
import { installNode } from './node-install';
import { GlobalLogger } from '../logger';

describe('node-install', () => {
  let logger: GlobalLogger;

  beforeEach(() => {
    logger = new GlobalLogger();
  });

  function makeRunCommand(outputs: Array<{ stdout: string; exitCode: number }>) {
    let callIndex = 0;
    return async (_cmd: string, _args: string[]) => {
      const output = outputs[callIndex] || outputs[outputs.length - 1];
      callIndex++;
      return { stdout: output.stdout, stderr: '', exitCode: output.exitCode };
    };
  }

  function makeDownload() {
    return async (
      _url: string,
      _dest: string,
      onProgress?: (p: number, d: number, t: number) => void
    ) => {
      if (onProgress) {
        onProgress(50, 29_000_000, 58_000_000);
        onProgress(100, 58_000_000, 58_000_000);
      }
    };
  }

  it('should skip install if node is already present', async () => {
    const runCommand = makeRunCommand([
      { stdout: 'v20.11.0', exitCode: 0 }, // check node
    ]);
    const download = makeDownload();

    const result = await installNode(download, runCommand, () => {}, (t: string) => logger.log(t));
    expect(result.success).toBe(true);
    expect(result.version).toBe('v20.11.0');
    const logs = logger.getLogs();
    expect(logs.some((l) => l.text.includes('Node.js 已安装'))).toBe(true);
  });

  // Full install flow (download + install) requires network access to
  // fetch the latest Node.js version. This is covered by integration testing
  // rather than unit tests. See Task 14 for manual verification steps.

  it('should fail if node verification fails after install', async () => {
    const runCommand = makeRunCommand([
      { stdout: '', exitCode: 1 },                     // check node (not found)
      { stdout: '', exitCode: 0 },                     // fetch version
      { stdout: '', exitCode: 0 },                     // install command
      { stdout: '', exitCode: 1 },                     // verify fails
    ]);
    const download = makeDownload();

    const result = await installNode(download, runCommand, () => {}, (t: string) => logger.log(t));
    expect(result.success).toBe(false);
  });
});
