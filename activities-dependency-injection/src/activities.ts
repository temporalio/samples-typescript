// @@@SNIPSTART typescript-activity-with-deps
export const createActivities = (dbConnection: Function) => ({
  async greet(msg: string): Promise<string> {
    const name = await dbConnection() // simulate read from db
    return `${msg}: ${name}`;
  },
  async greet_es(mensaje: string): Promise<string> {
    const name = await dbConnection() // simulate read from db
    return `${mensaje}: ${name}`;
  },
});
// @@@SNIPEND
