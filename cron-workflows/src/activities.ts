export async function greet(name: string, wfTime: string): Promise<void> {
  console.log(`Hello, ${name}!`);
  console.log(`Workflow time: `, wfTime);
  console.log(`Activity time: ` + Date.now());
}