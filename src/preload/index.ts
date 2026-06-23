import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('api', {
  // Environment check
  checkEnv: (): Promise<{ node: string | null; pnpm: string | null; platform: string }> =>
    ipcRenderer.invoke('check-env'),

  // Install steps
  installNode: (): Promise<void> =>
    ipcRenderer.invoke('install-node'),

  installPnpm: (): Promise<void> =>
    ipcRenderer.invoke('install-pnpm'),

  installClaudeCode: (): Promise<void> =>
    ipcRenderer.invoke('install-claude-code'),

  // Config generation
  generateConfig: (apiKey: string, baseUrl?: string): Promise<{ success: boolean; filePath: string; message: string }> =>
    ipcRenderer.invoke('generate-config', { apiKey, baseUrl }),

  // OS info
  getOSInfo: (): Promise<{ platform: string; version: string; build: number; name: string; arch: string }> =>
    ipcRenderer.invoke('get-os-info'),

  // Uninstall
  uninstallClaudeCode: (): Promise<{ success: boolean; message: string }> =>
    ipcRenderer.invoke('uninstall-claude-code'),

  // Log export
  exportLogs: (): Promise<void> =>
    ipcRenderer.invoke('export-logs'),

  // Events (Main → Renderer)
  onProgress: (callback: (data: { step: number; percent: number; message: string }) => void): void => {
    ipcRenderer.on('install-progress', (_event, data) => callback(data));
  },

  onLog: (callback: (data: { timestamp: string; text: string }) => void): void => {
    ipcRenderer.on('install-log', (_event, data) => callback(data));
  },

  onError: (callback: (data: { step: number; error: string; retryable: boolean; skippable: boolean }) => void): void => {
    ipcRenderer.on('install-error', (_event, data) => callback(data));
  },

  // Close guard
  setCloseGuard: (message: string): void => {
    ipcRenderer.send('set-close-guard', message);
  },

  clearCloseGuard: (): void => {
    ipcRenderer.send('clear-close-guard');
  },
});
