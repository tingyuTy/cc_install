import { describe, it, expect, afterEach } from 'vitest';
import { generateConfig } from './config-gen';
import { GlobalLogger } from '../logger';
import { join } from 'path';
import { tmpdir } from 'os';
import { readFileSync, unlinkSync, existsSync } from 'fs';

describe('config-gen', () => {
  const logger = new GlobalLogger();
  const testConfigPath = join(tmpdir(), `test-claude-${Date.now()}.json`);

  afterEach(() => {
    if (existsSync(testConfigPath)) unlinkSync(testConfigPath);
  });

  it('should generate valid JSON config with apiKey', async () => {
    const result = await generateConfig('sk-test-key-123', testConfigPath, logger);

    expect(result.success).toBe(true);
    expect(result.filePath).toBe(testConfigPath);
    expect(existsSync(testConfigPath)).toBe(true);

    const content = JSON.parse(readFileSync(testConfigPath, 'utf-8'));
    expect(content.apiKey).toBe('sk-test-key-123');
    expect(content.model).toBeDefined();
  });

  it('should use default DeepSeek base URL when not provided', async () => {
    const result = await generateConfig('sk-key', testConfigPath, logger);
    expect(result.success).toBe(true);

    const content = JSON.parse(readFileSync(testConfigPath, 'utf-8'));
    expect(content.baseUrl).toBe('https://api.deepseek.com');
  });

  it('should use custom base URL when provided', async () => {
    const result = await generateConfig('sk-key', testConfigPath, logger, 'https://custom.api.com');
    expect(result.success).toBe(true);

    const content = JSON.parse(readFileSync(testConfigPath, 'utf-8'));
    expect(content.baseUrl).toBe('https://custom.api.com');
  });

  it('should fail with empty apiKey', async () => {
    const result = await generateConfig('', testConfigPath, logger);
    expect(result.success).toBe(false);
    expect(result.message).toContain('API Key 不能为空');
  });

  it('should write model as deepseek-chat', async () => {
    const result = await generateConfig('sk-key', testConfigPath, logger);
    expect(result.success).toBe(true);

    const content = JSON.parse(readFileSync(testConfigPath, 'utf-8'));
    expect(content.model).toBe('deepseek-chat');
  });
});
