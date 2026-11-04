const consoleRef = globalThis.console;
const formatPrefix = (level: string): string => `[${level.toUpperCase()}]`;

const standaloneLogger = {
  debug: (...args: unknown[]): void => {
    if (process.env.NODE_ENV !== 'production') {
      consoleRef.debug(formatPrefix('debug'), ...args);
    }
  },
  info: (...args: unknown[]): void => {
    consoleRef.info(formatPrefix('info'), ...args);
  },
  warn: (...args: unknown[]): void => {
    consoleRef.warn(formatPrefix('warn'), ...args);
  },
  error: (...args: unknown[]): void => {
    consoleRef.error(formatPrefix('error'), ...args);
  },
  success: (...args: unknown[]): void => {
    consoleRef.info(formatPrefix('success'), ...args);
  },
  log: ({ level, args }: { level: string; args: unknown[] }): void => {
    const method =
      level === 'info'
        ? 'info'
        : level === 'warn'
          ? 'warn'
          : level === 'error'
            ? 'error'
            : 'log';
    consoleRef[method](...args);
  },
};

export { standaloneLogger as logger };
export default standaloneLogger;
