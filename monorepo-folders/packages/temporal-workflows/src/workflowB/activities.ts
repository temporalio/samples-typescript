export async function activityC(name: string): Promise<string> {
  console.log('hello from activityC in', name);
  return `ActivityC result: C-${name}!`;
}

export async function activityD(name: string): Promise<string> {
  console.log('hello from activityD in', name);
  return `ActivityD result: D-${name}!`;
}
