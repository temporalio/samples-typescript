import winston from 'winston';

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
  return Object.keys(rest).length === 0
    ? `${getDateStr(timestamp)} [${label}] ${level}: ${message}`
    : `${getDateStr(timestamp)} [${label}] ${level}: ${message} ${JSON.stringify(rest, undefined, 4)}`;
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
