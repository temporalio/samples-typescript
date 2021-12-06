export async function Activity1(arg1: string): Promise<string> {
  if (!arg1) throw new Error('arg1 is required');
  console.log`[Activity1] arg1: ${arg1}!`;
  return `[result from Activity1: ${arg1}]`;
}
export async function Activity2(arg: string): Promise<string> {
  if (!arg) throw new Error('arg is required');
  console.log`[Activity2] arg: ${arg}!`;
  return `[result from Activity2: ${arg}]`;
}
export async function Activity3(arg2: string, arg: string): Promise<string> {
  if (!arg2) throw new Error('arg2 is required');
  return `Activity3 received arg2: ${arg2}: 
  
  And received: ${arg}`;
}

export async function Activity4(result1: string): Promise<string> {
  if (!result1) throw new Error('result1 is required');
  console.log`[Activity4] result1: ${result1}!`;
  return `[result from Activity4: ${result1}]`;
}

export async function Activity5(arg3: string, result4: string): Promise<string> {
  return `Activity5 received:
  arg3: ${arg3}: 
  result4: ${result4}:`;
}
