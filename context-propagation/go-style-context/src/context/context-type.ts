/**
 * This is the Context interface you will use everywhere.
 */
export interface GoStyleContext {
  customer?: string;

  error: (message: string, metadata?: Record<string, unknown>) => void;
  warn: (message: string, metadata?: Record<string, unknown>) => void;
  info: (message: string, metadata?: Record<string, unknown>) => void;
  debug: (message: string, metadata?: Record<string, unknown>) => void;
}

/**
 * This is the Context implementation you would originally create in your normal code.
 */
export class NormalContext implements GoStyleContext {
  constructor(public readonly customer?: string) {}

  info(message: string, metadata?: Record<string, unknown>): void {
    console.info(message, metadata);
  }
  warn(message: string, metadata?: Record<string, unknown>): void {
    console.warn(message, metadata);
  }
  error(message: string, metadata?: Record<string, unknown>): void {
    console.error(message, metadata);
  }
  debug(message: string, metadata?: Record<string, unknown>): void {
    console.debug(message, metadata);
  }
}
