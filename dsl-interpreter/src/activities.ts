export async function activity1(arg1: string): Promise<string> {
  if (!arg1) throw new Error('arg1 is required');
  console.log`[activity1] arg1: ${arg1}!`;
  return `[result from activity1: ${arg1}]`;
}
export async function activity2(arg: string): Promise<string> {
  if (!arg) throw new Error('arg is required');
  console.log`[activity2] arg: ${arg}!`;
  return `[result from activity2: ${arg}]`;
}
export async function activity3(arg2: string, arg: string): Promise<string> {
  if (!arg2) throw new Error('arg2 is required');
  return `activity3 received arg2: ${arg2}: 
  
  And received: ${arg}`;
}

export async function activity4(result1: string): Promise<string> {
  if (!result1) throw new Error('result1 is required');
  console.log`[activity4] result1: ${result1}!`;
  return `[result from activity4: ${result1}]`;
}

export async function activity5(arg3: string, result4: string): Promise<string> {
  return `activity5 received:
  arg3: ${arg3}: 
  result4: ${result4}:`;
}
