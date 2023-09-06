import winston from 'winston';
import util from 'util';
import { LEVEL, SPLAT, MESSAGE } from 'triple-beam';

// There's nothing Temporal specific in this file.
// It is just a helper to create a Winston logger with some reasonable settings.

export interface LoggerOptions {
  isProduction: boolean;
  logFilePath: string;
}

/** Turns a given timestamp or current Date to an ISO date string */
function getDateStr(timestamp?: number): string {
  return timestamp ? new Date(timestamp).toJSON() : new Date().toJSON();
}

/** Format function for logging in development */
const devLogFormat = winston.format.printf(({ level, message, label, timestamp, ...rest }) => {
  // The type signature in winston is wrong
  const { [LEVEL]: _lvl, [SPLAT]: _splt, [MESSAGE]: _msg, ...restNoSymbols } = rest as Record<string | symbol, any>;
  return Object.keys(restNoSymbols).length === 0
    ? `${getDateStr(timestamp)} [${label}] ${level}: ${message}`
    : `${getDateStr(timestamp)} [${label}] ${level}: ${message} ${util.inspect(restNoSymbols, false, 4, true)}`;
});

/** Create a winston logger from given options */
export function createLogger({ isProduction, logFilePath }: LoggerOptions): winston.Logger {
  return winston.createLogger({
    level: 'debug',
    format: isProduction ? winston.format.json() : winston.format.combine(winston.format.colorize(), devLogFormat),
    transports: [
      isProduction ? new winston.transports.File({ filename: logFilePath }) : new winston.transports.Console(),
    ],
  });
}
