// @@@SNIPSTART typescript-activity-with-deps
export default (greeting: string) => ({
  async greet(name: string): Promise<string> {
    return `${greeting} ${name}`;
  },
});
// @@@SNIPEND
