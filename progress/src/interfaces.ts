export type Progress = () => {
  execute(): Promise<number>;
  queries: {
    getProgress(): number;
  };
};
