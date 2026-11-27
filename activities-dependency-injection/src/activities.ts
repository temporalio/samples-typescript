/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
// @@@SNIPSTART typescript-activity-with-deps
export interface DB {
  get(key: string): Promise<string>;
}

interface GreetInput {
  msg: string;
}

interface GreetSpanishInput {
  mensaje: string;
}

interface GreetResult {
  greeting: string;
}

export const createActivities = (db: DB) => ({
  async greet({ msg }: GreetInput): Promise<GreetResult> {
    const name = await db.get('name'); // simulate read from db
    return { greeting: `${msg}: ${name}` };
  },
  async greet_es({ mensaje }: GreetSpanishInput): Promise<GreetResult> {
    const name = await db.get('name'); // simulate read from db
    return { greeting: `${mensaje}: ${name}` };
  },
});
// @@@SNIPEND
