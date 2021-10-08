type ProcessOrderParams = { orderProcessingMS: number; sendDelayedEmailTimeoutMS: number };

export type ProcessOrder = (params: ProcessOrderParams) => {
  execute(): Promise<void>;
};
