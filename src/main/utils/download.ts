import { get } from 'https';
import { createWriteStream, existsSync, mkdirSync, unlinkSync } from 'fs';
import { dirname } from 'path';
import { GlobalLogger } from '../logger';

export function createDownloader(logger: GlobalLogger) {
  return async function downloadFile(
    url: string,
    destPath: string,
    onProgress?: (percent: number, downloaded: number, total: number) => void
  ): Promise<void> {
    const maxRetries = 3;
    const retryDelays = [3000, 6000, 12000];

    logger.log(`下载地址: ${url}`);

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          logger.log(`重试第 ${attempt} 次...`);
        }
        await doDownload(url, destPath, onProgress);
        logger.log(`下载完成`);
        return;
      } catch (err: any) {
        logger.log(`下载失败: ${err.message}`);
        // Don't retry HTTP errors (4xx, 5xx)
        if (err.message && err.message.startsWith('HTTP ')) {
          throw err;
        }
        if (attempt < maxRetries) {
          const delay = retryDelays[attempt];
          logger.log(`等待 ${delay / 1000}s 后重试...`);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          throw new Error(`下载失败，已重试 ${maxRetries} 次: ${err.message}`);
        }
      }
    }
  };
}

function doDownload(
  url: string,
  destPath: string,
  onProgress?: (percent: number, downloaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const dir = dirname(destPath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    const file = createWriteStream(destPath);

    const protocol = url.startsWith('https') ? require('https') : require('http');
    const req = protocol.get(url, (response: any) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          file.close();
          if (existsSync(destPath)) unlinkSync(destPath);
          doDownload(redirectUrl, destPath, onProgress).then(resolve, reject);
          return;
        }
      }

      if (response.statusCode !== 200) {
        file.close();
        if (existsSync(destPath)) unlinkSync(destPath);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      const total = parseInt(response.headers['content-length'] || '0', 10);
      let downloaded = 0;

      response.on('data', (chunk: Buffer) => {
        downloaded += chunk.length;
        if (total > 0 && onProgress) {
          const percent = Math.round((downloaded / total) * 100);
          onProgress(percent, downloaded, total);
        }
      });

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        if (total > 0 && onProgress) onProgress(100, downloaded, total);
        resolve();
      });

      file.on('error', (err: Error) => {
        file.close();
        if (existsSync(destPath)) unlinkSync(destPath);
        reject(err);
      });
    });

    req.on('error', (err: Error) => {
      if (existsSync(destPath)) unlinkSync(destPath);
      reject(err);
    });

    req.setTimeout(300000, () => {
      req.destroy();
      if (existsSync(destPath)) unlinkSync(destPath);
      reject(new Error('下载超时'));
    });
  });
}
