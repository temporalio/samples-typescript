export interface IncompatibleActivityInput {
  /** Identifier for the caller */
  readonly calledBy: string;
  /** Extra data used to illustrate incompatible changes */
  readonly moreData: string;
}

/** Basic activity for the workflow. */
export async function someActivity(calledBy: string): Promise<string> {
  return `SomeActivity called by ${calledBy}`;
}

/** Activity that accepts different input to illustrate an incompatible change. */
export async function someIncompatibleActivity(input: IncompatibleActivityInput): Promise<string> {
  return `SomeIncompatibleActivity called by ${input.calledBy} with ${input.moreData}`;
}
