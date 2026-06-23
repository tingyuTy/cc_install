import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { createDownloader } from './download';
import { GlobalLogger } from '../logger';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFileSync, unlinkSync, existsSync } from 'fs';

describe('download utils', () => {
  let server: ReturnType<typeof createServer>;
  let serverUrl: string;
  let logger: GlobalLogger;

  beforeEach(() => {
    logger = new GlobalLogger();
  });

  afterEach(() => {
    if (server) server.close();
  });

  function startServer(content: Buffer, statusCode = 200) {
    return new Promise<void>((resolve) => {
      server = createServer((_req: IncomingMessage, res: ServerResponse) => {
        res.writeHead(statusCode, { 'Content-Length': String(content.length) });
        res.end(content);
      });
      server.listen(0, () => {
        const addr = server.address() as { port: number };
        serverUrl = `http://localhost:${addr.port}/test-file`;
        resolve();
      });
    });
  }

  it('should download a file and save to disk', async () => {
    const content = Buffer.from('hello download test');
    await startServer(content);
    const download = createDownloader(logger);
    const destPath = join(tmpdir(), `test-download-${Date.now()}.txt`);

    try {
      await download(serverUrl, destPath);
      expect(existsSync(destPath)).toBe(true);
      expect(readFileSync(destPath, 'utf-8')).toBe('hello download test');
    } finally {
      if (existsSync(destPath)) unlinkSync(destPath);
    }
  });

  it('should report progress during download', async () => {
    const content = Buffer.alloc(10000, 'x');
    await startServer(content);
    const download = createDownloader(logger);
    const destPath = join(tmpdir(), `test-download-${Date.now()}.txt`);
    const progressCalls: Array<{ percent: number }> = [];

    try {
      await download(serverUrl, destPath, (percent) => {
        progressCalls.push({ percent });
      });
      expect(progressCalls.length).toBeGreaterThan(0);
      expect(progressCalls[progressCalls.length - 1].percent).toBe(100);
    } finally {
      if (existsSync(destPath)) unlinkSync(destPath);
    }
  });

  it('should log download URL to logger', async () => {
    const content = Buffer.from('test');
    await startServer(content);
    const download = createDownloader(logger);
    const destPath = join(tmpdir(), `test-download-${Date.now()}.txt`);

    try {
      await download(serverUrl, destPath);
      const logs = logger.getLogs();
      const hasUrlLog = logs.some((l) => l.text.includes(serverUrl));
      expect(hasUrlLog).toBe(true);
    } finally {
      if (existsSync(destPath)) unlinkSync(destPath);
    }
  });

  it('should throw on 404 response', async () => {
    await startServer(Buffer.from('not found'), 404);
    const download = createDownloader(logger);
    const destPath = join(tmpdir(), `test-download-${Date.now()}.txt`);

    await expect(download(serverUrl, destPath)).rejects.toThrow('HTTP 404');
  });
});
