import { proxySinks, inWorkflowContext } from '@temporalio/workflow';
import logger from './logger';

const sharedLogger = inWorkflowContext() ? proxySinks().defaultWorkerLogger : logger;
export default sharedLogger;
