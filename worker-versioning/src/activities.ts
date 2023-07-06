export async function greet(name: string): Promise<string> {
  return `Hello, ${name}!`;
}

// This function represents the need to change the interface to `greet`. Perhaps we didn't realize
// we would need to pass additional data, and we change the string parameter to an object. (Hint:
// It's a great idea to always start with objects for this reason, as they can be extended without
// breaking compatibility as long as you use a wire format that maintains compatibility.)
export async function superGreet(input: SuperGreetInput): Promise<string> {
  return `Hello, ${input.name}! You are number ${input.aNumber}`;
}

export interface SuperGreetInput {
  name: string;
  aNumber: number;
}
