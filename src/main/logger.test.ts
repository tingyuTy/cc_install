import { describe, it, expect, beforeEach } from 'vitest';
import { GlobalLogger } from './logger';

describe('GlobalLogger', () => {
  let logger: GlobalLogger;

  beforeEach(() => {
    logger = new GlobalLogger();
  });

  it('should add a log entry with timestamp', () => {
    logger.log('检测到系统: darwin');
    const logs = logger.getLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].text).toBe('检测到系统: darwin');
    expect(logs[0].timestamp).toMatch(/^\d{2}:\d{2}:\d{2}$/);
  });

  it('should maintain log order', () => {
    logger.log('第一条日志');
    logger.log('第二条日志');
    logger.log('第三条日志');
    const logs = logger.getLogs();
    expect(logs).toHaveLength(3);
    expect(logs[0].text).toBe('第一条日志');
    expect(logs[2].text).toBe('第三条日志');
  });

  it('should export logs as formatted string', () => {
    logger.log('test message');
    const exported = logger.exportToString();
    expect(exported).toContain('test message');
    expect(exported).toMatch(/^\[\d{2}:\d{2}:\d{2}\] test message$/m);
  });

  it('should call onLogEntry callback for each log', () => {
    const entries: string[] = [];
    logger.onLogEntry((entry) => entries.push(entry.text));
    logger.log('first');
    logger.log('second');
    expect(entries).toEqual(['first', 'second']);
  });

  it('should clear all logs', () => {
    logger.log('some log');
    logger.clear();
    expect(logger.getLogs()).toHaveLength(0);
  });
});
