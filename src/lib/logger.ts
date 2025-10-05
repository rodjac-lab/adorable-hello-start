/**
 * Centralized logging utility with environment-aware behavior
 * - Development: All logs to console
 * - Production: Only errors/warnings, with optional external reporting
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  isDevelopment: boolean;
  enableDebug: boolean;
  enableErrorReporting: boolean;
}

const resolveIsDevelopment = (): boolean => {
  try {
    const meta = import.meta as { env?: { DEV?: boolean } };
    if (typeof meta.env?.DEV === 'boolean') {
      return meta.env.DEV;
    }
  } catch (error) {
    // Ignore access errors when import.meta is unavailable (Node test environment)
  }

  if (typeof process !== 'undefined' && process.env && 'NODE_ENV' in process.env) {
    return process.env.NODE_ENV !== 'production';
  }

  return false;
};

class Logger {
  private config: LoggerConfig;

  constructor() {
    const isDevelopment = resolveIsDevelopment();
    this.config = {
      isDevelopment,
      enableDebug: isDevelopment,
      enableErrorReporting: !isDevelopment,
    };
  }

  private log(level: LogLevel, message: string, ...args: any[]): void {
    // In production, skip debug logs
    if (!this.config.isDevelopment && level === 'debug') {
      return;
    }

    // Format message with timestamp in development
    const prefix = this.config.isDevelopment
      ? `[${new Date().toISOString().split('T')[1].split('.')[0]}] [${level.toUpperCase()}]`
      : `[${level.toUpperCase()}]`;

    // Use appropriate console method
    const consoleMethod = level === 'debug' ? 'log' : level;
    console[consoleMethod](prefix, message, ...args);

    // In production, report errors to external service (future enhancement)
    if (this.config.enableErrorReporting && level === 'error') {
      this.reportError(message, args);
    }
  }

  /**
   * Debug logs - only shown in development
   */
  debug(message: string, ...args: any[]): void {
    this.log('debug', message, ...args);
  }

  /**
   * Info logs - shown in all environments
   */
  info(message: string, ...args: any[]): void {
    this.log('info', message, ...args);
  }

  /**
   * Warning logs - shown in all environments
   */
  warn(message: string, ...args: any[]): void {
    this.log('warn', message, ...args);
  }

  /**
   * Error logs - shown in all environments and reported externally
   */
  error(message: string, ...args: any[]): void {
    this.log('error', message, ...args);
  }

  /**
   * Report error to external monitoring service (e.g., Sentry)
   * Currently a placeholder for future implementation
   */
  private reportError(message: string, args: any[]): void {
    // TODO: Integrate with error monitoring service
    // Example: Sentry.captureException(new Error(message), { extra: args });
  }

  /**
   * Group logs together (useful for complex operations)
   */
  group(label: string, callback: () => void): void {
    if (this.config.isDevelopment) {
      console.group(label);
      callback();
      console.groupEnd();
    } else {
      callback();
    }
  }

  /**
   * Measure and log execution time
   */
  time(label: string): void {
    if (this.config.isDevelopment) {
      console.time(label);
    }
  }

  timeEnd(label: string): void {
    if (this.config.isDevelopment) {
      console.timeEnd(label);
    }
  }
}

// Export singleton instance
export const logger = new Logger();
