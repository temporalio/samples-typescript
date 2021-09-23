export type ProcessOrder = (orderProcessingMS: number, sendDelayedEmailTimeoutMS: number) => {
  execute(): Promise<void>;
};
