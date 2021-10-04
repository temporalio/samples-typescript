// Extend the generic Workflow interface to check that Example is a valid workflow interface
// Workflow interfaces are useful for generating type safe workflow clients
export type Example = (name: string) => {
  execute(): Promise<string>;
};
