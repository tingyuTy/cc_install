import { describe, it, expect } from 'vitest';
import { getNodeInstallCommand, getNodeDownloadUrl, getPlatform } from './platform';

describe('platform utils', () => {
  describe('getPlatform', () => {
    it('should return darwin or win32', () => {
      const platform = getPlatform();
      expect(['darwin', 'win32']).toContain(platform);
    });
  });

  describe('getNodeDownloadUrl', () => {
    it('should generate macOS download URL', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const url = getNodeDownloadUrl('v20.11.0');
      expect(url).toBe('https://nodejs.org/dist/v20.11.0/node-v20.11.0-darwin-x64.pkg');
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should generate Windows download URL', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const url = getNodeDownloadUrl('v20.11.0');
      expect(url).toBe('https://nodejs.org/dist/v20.11.0/node-v20.11.0-win-x64.msi');
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });

  describe('getNodeInstallCommand', () => {
    it('should generate macOS install command', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'darwin' });
      const cmd = getNodeInstallCommand('/tmp/node.pkg');
      expect(cmd).toEqual({
        cmd: 'sudo',
        args: ['installer', '-pkg', '/tmp/node.pkg', '-target', '/'],
        useSudo: true,
      });
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });

    it('should generate Windows install command', () => {
      const originalPlatform = process.platform;
      Object.defineProperty(process, 'platform', { value: 'win32' });
      const cmd = getNodeInstallCommand('C:\\temp\\node.msi');
      expect(cmd).toEqual({
        cmd: 'msiexec',
        args: ['/i', 'C:\\temp\\node.msi', '/quiet'],
        useSudo: false,
      });
      Object.defineProperty(process, 'platform', { value: originalPlatform });
    });
  });
});
