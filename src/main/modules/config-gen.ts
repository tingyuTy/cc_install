import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname } from 'path';
import { GlobalLogger } from '../logger';

interface ClaudeConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

export async function generateConfig(
  apiKey: string,
  filePath: string,
  logger: GlobalLogger,
  baseUrl?: string
): Promise<{ success: boolean; filePath: string; message: string }> {
  logger.log('正在生成 DeepSeek 配置...');

  if (!apiKey || !apiKey.trim()) {
    const msg = 'API Key 不能为空';
    logger.log(`配置失败: ${msg}`);
    return { success: false, filePath, message: msg };
  }

  const config: ClaudeConfig = {
    apiKey: apiKey.trim(),
    model: 'deepseek-chat',
    baseUrl: baseUrl || 'https://api.deepseek.com',
  };

  try {
    const dir = dirname(filePath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    writeFileSync(filePath, JSON.stringify(config, null, 2), 'utf-8');
    logger.log(`配置文件已保存到: ${filePath}`);
    logger.log(`模型: ${config.model}`);
    logger.log(`API 地址: ${config.baseUrl}`);

    return {
      success: true,
      filePath,
      message: `配置成功！模型: ${config.model}, API: ${config.baseUrl}`,
    };
  } catch (err: any) {
    const msg = `写入配置文件失败: ${err.message}`;
    logger.log(msg);
    return { success: false, filePath, message: msg };
  }
}
