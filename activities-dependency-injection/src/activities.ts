// @@@SNIPSTART typescript-activity-with-deps

export interface DB {
  get(key: string): Promise<string>;
}

export const createActivities = (db: DB) => ({
  async greet(msg: string): Promise<string> {
    const name = await db.get('name'); // simulate read from db
    return `${msg}: ${name}`;
  },
  async greet_es(mensaje: string): Promise<string> {
    const name = await db.get('name'); // simulate read from db
    return `${mensaje}: ${name}`;
  },
});
// @@@SNIPEND
