export type Example = (name: string) => {
  execute(): Promise<string>;
};
