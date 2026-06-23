import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { homedir } from 'os';
import { GlobalLogger } from '../logger';

export async function generateConfig(
  apiKey: string,
  _filePath: string, // kept for backward compat, unused
  logger: GlobalLogger,
  baseUrl?: string
): Promise<{ success: boolean; filePath: string; message: string }> {
  logger.log('正在配置 DeepSeek 模型...');

  if (!apiKey || !apiKey.trim()) {
    const msg = 'API Key 不能为空';
    logger.log(`配置失败: ${msg}`);
    return { success: false, filePath: '', message: msg };
  }

  const key = apiKey.trim();
  const apiBase = baseUrl?.trim() || 'https://api.deepseek.com/anthropic';
  const home = homedir();

  try {
    // 1. ~/.claude.json — skip Anthropic onboarding
    const claudeJsonPath = join(home, '.claude.json');
    const onboardingConfig = {
      hasCompletedOnboarding: true,
    };
    writeFileSync(claudeJsonPath, JSON.stringify(onboardingConfig, null, 2), 'utf-8');
    logger.log(`已写入: ${claudeJsonPath}`);

    // 2. ~/.claude/settings.json — DeepSeek provider config
    const settingsDir = join(home, '.claude');
    if (!existsSync(settingsDir)) {
      mkdirSync(settingsDir, { recursive: true });
    }

    const settingsPath = join(settingsDir, 'settings.json');
    const settingsConfig = {
      env: {
        ANTHROPIC_BASE_URL: apiBase,
        ANTHROPIC_AUTH_TOKEN: key,
        ANTHROPIC_MODEL: 'deepseek-chat',
        ANTHROPIC_DEFAULT_OPUS_MODEL: 'deepseek-reasoner',
        ANTHROPIC_DEFAULT_SONNET_MODEL: 'deepseek-chat',
        ANTHROPIC_DEFAULT_HAIKU_MODEL: 'deepseek-chat',
        CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC: '1',
        DISABLE_COST_WARNINGS: '1',
      },
    };
    writeFileSync(settingsPath, JSON.stringify(settingsConfig, null, 2), 'utf-8');
    logger.log(`已写入: ${settingsPath}`);
    logger.log(`模型: deepseek-chat / deepseek-reasoner`);
    logger.log(`API 地址: ${apiBase}`);

    return {
      success: true,
      filePath: settingsPath,
      message: `DeepSeek 配置成功！\n模型: deepseek-chat / deepseek-reasoner\nAPI: ${apiBase}`,
    };
  } catch (err: any) {
    const msg = `写入配置文件失败: ${err.message}`;
    logger.log(msg);
    return { success: false, filePath: '', message: msg };
  }
}
