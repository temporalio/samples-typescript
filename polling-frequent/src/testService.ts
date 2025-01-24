export async function greetService(name: string): Promise<string> {
  const randomVal = Math.random();

  if (randomVal < 0.2) {
    return `Hello, ${name}! The random value is ${randomVal.toFixed(2)}`;
  } else {
    throw new Error(`Service not ready yet. Random value: ${randomVal.toFixed(2)}`);
  }
}
