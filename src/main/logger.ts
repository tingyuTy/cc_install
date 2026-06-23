export interface LogEntry {
  timestamp: string;
  text: string;
}

export class GlobalLogger {
  private logs: LogEntry[] = [];
  private listeners: Array<(entry: LogEntry) => void> = [];

  log(text: string): void {
    const entry: LogEntry = {
      timestamp: new Date().toTimeString().slice(0, 8),
      text,
    };
    this.logs.push(entry);
    this.listeners.forEach((cb) => cb(entry));
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  exportToString(): string {
    return this.logs
      .map((entry) => `[${entry.timestamp}] ${entry.text}`)
      .join('\n');
  }

  onLogEntry(callback: (entry: LogEntry) => void): void {
    this.listeners.push(callback);
  }

  clear(): void {
    this.logs = [];
  }
}
