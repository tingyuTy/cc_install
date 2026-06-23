import { getPlatform } from '../utils/platform';

export async function checkNode(
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>
): Promise<string | null> {
  const result = await runCommand('node', ['-v']);
  if (result.exitCode === 0 && result.stdout.trim()) {
    return result.stdout.trim();
  }
  return null;
}

export async function checkPnpm(
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>
): Promise<string | null> {
  const result = await runCommand('pnpm', ['-v']);
  if (result.exitCode === 0 && result.stdout.trim()) {
    return result.stdout.trim();
  }
  return null;
}

export async function checkEnv(
  runCommand: (cmd: string, args: string[]) => Promise<{ stdout: string; stderr: string; exitCode: number }>
): Promise<{ node: string | null; pnpm: string | null; platform: string }> {
  const [node, pnpm] = await Promise.all([
    checkNode(runCommand),
    checkPnpm(runCommand),
  ]);
  return {
    node,
    pnpm,
    platform: getPlatform(),
  };
}
