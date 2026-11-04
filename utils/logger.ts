import { logger as platformLogger } from '@lark-apaas/client-toolkit/logger';

const createLogger = () => ({
  debug: (...args: unknown[]) => {
    if (import.meta.env.DEV) platformLogger.debug('[DEBUG]', String(...args));
  },
  info: (...args: unknown[]) => {
    platformLogger.info('[INFO]', String(...args));
  },
  warn: (...args: unknown[]) => {
    platformLogger.warn('[WARN]', String(...args));
  },
  error: (...args: unknown[]) => {
    platformLogger.error('[ERROR]', String(...args));
  },
  success: (...args: unknown[]) => {
    platformLogger.info('[SUCCESS]', String(...args));
  },
  log: ({ level, args }: { level: string; args: unknown[] }) => {
    const method =
      level === 'info'
        ? 'info'
        : level === 'warn'
          ? 'warn'
          : level === 'error'
            ? 'error'
            : 'log';
    console[method](...args);
  },
});

export const logger = createLogger();
export default logger;
