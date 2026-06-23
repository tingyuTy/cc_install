import { describe, it, expect, afterEach } from 'vitest';
import { generateConfig } from './config-gen';
import { GlobalLogger } from '../logger';
import { join } from 'path';
import { homedir } from 'os';
import { readFileSync, unlinkSync, existsSync, rmdirSync } from 'fs';

describe('config-gen', () => {
  const logger = new GlobalLogger();
  const home = homedir();
  const claudeJson = join(home, '.claude.json');
  const settingsJson = join(home, '.claude', 'settings.json');

  afterEach(() => {
    if (existsSync(claudeJson)) unlinkSync(claudeJson);
    if (existsSync(settingsJson)) unlinkSync(settingsJson);
    try { rmdirSync(join(home, '.claude')); } catch (_) { /* ok if not empty */ }
  });

  it('should write ~/.claude.json with onboarding bypass', async () => {
    const result = await generateConfig('sk-test-key-123', '', logger);

    expect(result.success).toBe(true);
    expect(existsSync(claudeJson)).toBe(true);
    const content = JSON.parse(readFileSync(claudeJson, 'utf-8'));
    expect(content.hasCompletedOnboarding).toBe(true);
  });

  it('should write ~/.claude/settings.json with DeepSeek env vars', async () => {
    const result = await generateConfig('sk-key', '', logger);
    expect(result.success).toBe(true);
    expect(existsSync(settingsJson)).toBe(true);

    const content = JSON.parse(readFileSync(settingsJson, 'utf-8'));
    expect(content.env.ANTHROPIC_BASE_URL).toBe('https://api.deepseek.com/anthropic');
    expect(content.env.ANTHROPIC_AUTH_TOKEN).toBe('sk-key');
    expect(content.env.ANTHROPIC_MODEL).toBe('deepseek-chat');
    expect(content.env.ANTHROPIC_DEFAULT_SONNET_MODEL).toBe('deepseek-chat');
    expect(content.env.ANTHROPIC_DEFAULT_OPUS_MODEL).toBe('deepseek-reasoner');
    expect(content.env.CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC).toBe('1');
  });

  it('should use custom base URL when provided', async () => {
    const result = await generateConfig('sk-key', '', logger, 'https://custom.api.com/anthropic');
    expect(result.success).toBe(true);

    const content = JSON.parse(readFileSync(settingsJson, 'utf-8'));
    expect(content.env.ANTHROPIC_BASE_URL).toBe('https://custom.api.com/anthropic');
  });

  it('should fail with empty apiKey', async () => {
    const result = await generateConfig('', '', logger);
    expect(result.success).toBe(false);
    expect(result.message).toContain('API Key 不能为空');
  });
});
