export const childWorkflow = (name: string) => ({
  async execute() {
    return 'i am a child named ' + name;
  },
})