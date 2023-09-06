import { Context } from '@temporalio/activity';

export async function notifyHumanForVerification(task: string): Promise<void> {
  Context.current().log.info(`🤖 Dear human, please verify that this is correct: ${task}`);
}

export async function collectFeedback(): Promise<void> {
  Context.current().log.info('🤖 Dear human, how was your experience with this verification workflow?');
}
