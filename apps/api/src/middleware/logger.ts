/**
 * Minimal levelled logger with request correlation.
 *
 * A dependency-free logger keeps the API installable with nothing but Node,
 * which matters for a project whose first goal is that a newcomer can run it.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const ORDER: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

let threshold: number = ORDER.info;

export function setLogLevel(level: LogLevel): void {
  threshold = ORDER[level] ?? ORDER.info;
}

function stamp(): string {
  return new Date().toISOString();
}

function emit(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
  if (ORDER[level] < threshold) return;
  const suffix = meta && Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const line = `${stamp()} ${level.toUpperCase().padEnd(5)} ${message}${suffix}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => emit('debug', message, meta),
  info: (message: string, meta?: Record<string, unknown>) => emit('info', message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => emit('warn', message, meta),
  error: (message: string, meta?: Record<string, unknown>) => emit('error', message, meta)
};

/** A short id used to tie a request's log lines together. */
export function requestId(): string {
  return `req_${Math.random().toString(36).slice(2, 10)}`;
}
