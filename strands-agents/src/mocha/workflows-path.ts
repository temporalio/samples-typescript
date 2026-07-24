import { fileURLToPath } from 'node:url';

// Absolute path to the workflows entrypoint, resolved for the ESM runtime
// (tests run under tsx, so the `.ts` source is always the target).
export const workflowsPath = fileURLToPath(new URL('../workflows.ts', import.meta.url));
