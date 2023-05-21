export async function notifyHumanForVerification(task: string): Promise<void> {
  console.log(`🤖 Dear human, please verify that this is correct: ${task}`);
}

export async function collectFeedback(): Promise<void> {
  console.log('🤖 Dear human, how was your experience with this verification workflow?');
}
