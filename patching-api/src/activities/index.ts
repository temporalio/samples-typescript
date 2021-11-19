export async function activityA(): Promise<void> {
  console.log('activityA');
}
export async function activityB(): Promise<void> {
  console.log('activityB');
}
export async function activityThatMustRunAfterA(): Promise<void> {
  console.log('activityThatMustRunAfterA');
}
