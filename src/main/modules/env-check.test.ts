import { describe, it, expect } from 'vitest';
import { checkNode, checkPnpm, checkEnv } from './env-check';
import { createRunCommand } from '../utils/shell';
import { GlobalLogger } from '../logger';

describe('env-check', () => {
  const logger = new GlobalLogger();
  const runCommand = createRunCommand(logger);

  describe('checkNode', () => {
    it('should return node version when installed', async () => {
      const version = await checkNode(runCommand);
      if (version) {
        expect(version).toMatch(/^v\d+\.\d+\.\d+/);
      }
    });
  });

  describe('checkPnpm', () => {
    it('should return pnpm version when installed', async () => {
      const version = await checkPnpm(runCommand);
      if (version) {
        expect(version).toMatch(/^\d+\.\d+\.\d+/);
      }
    });
  });

  describe('checkEnv', () => {
    it('should return env status with platform', async () => {
      const result = await checkEnv(runCommand);
      expect(result).toHaveProperty('node');
      expect(result).toHaveProperty('pnpm');
      expect(result).toHaveProperty('platform');
      expect(['darwin', 'win32']).toContain(result.platform);
    });
  });
});
