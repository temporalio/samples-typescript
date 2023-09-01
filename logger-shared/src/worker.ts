import { defaultSinks, Logger, LogLevel, LogMetadata, Worker } from '@temporalio/worker';
import * as activities from './activities';
import logger from './logger';

async function main() {
  // The Worker side of our logger sinks, forwards logs from Workflows to a Winston logger
  const workflowLogger: Logger = {
    log(level: LogLevel, message: string, meta?: LogMetadata) {
      logger.log(message, meta);
    },
    trace(message: string, meta?: LogMetadata) {
      logger.verbose(message, meta);
    },
    debug(message: string, meta?: LogMetadata) {
      logger.debug(message, meta);
    },
    info(message: string, meta?: LogMetadata) {
      logger.info(message, meta);
    },
    warn(message: string, meta?: LogMetadata) {
      logger.warn(message, meta);
    },
    error(message: string, meta?: LogMetadata) {
      logger.error(message, meta);
    },
  };

  const worker = await Worker.create({
    workflowsPath: require.resolve('./workflows'),
    activities,
    taskQueue: 'logger-shared',
    bundlerOptions: { ignoreModules: ['./logger'] },
    // Inject sinks
    sinks: defaultSinks(workflowLogger),
  });

  await worker.run();
}

main().then(
  () => void process.exit(0),
  (err) => {
    logger.error('Process failed', err);
    process.exit(1);
  },
);
