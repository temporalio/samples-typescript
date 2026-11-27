export interface IncompatibleActivityInput {
  /** Identifier for the caller */
  readonly calledBy: string;
  /** Extra data used to illustrate incompatible changes */
  readonly moreData: string;
}

type SomeActivityInput = { calledBy: string };
type ActivityResult = { message: string };

/** Basic activity for the workflow. */
export async function someActivity({ calledBy }: SomeActivityInput): Promise<ActivityResult> {
  return { message: `SomeActivity called by ${calledBy}` };
}

/** Activity that accepts different input to illustrate an incompatible change. */
export async function someIncompatibleActivity(input: IncompatibleActivityInput): Promise<ActivityResult> {
  return { message: `SomeIncompatibleActivity called by ${input.calledBy} with ${input.moreData}` };
}
