import { WorkflowClient } from '@temporalio/client';
import { DSLInterpreter, DSL } from './workflows';
import yaml from 'js-yaml';
import fs from 'fs';

// default DSL structure if no arguments are passed
// validate with http://nodeca.github.io/js-yaml/
let dslInput: DSL = {
  variables: { arg1: 'value1', arg2: 'value2' },
  root: {
    sequence: {
      elements: [
        { activity: { name: 'activity1', arguments: ['arg1'], result: 'result1' } },
        { activity: { name: 'activity2', arguments: ['result1'], result: 'result2' } },
        { activity: { name: 'activity3', arguments: ['arg2', 'result2'], result: 'result3' } },
      ],
    },
  },
};

async function run() {
  const path = process.argv[2];
  if (path) {
    dslInput = yaml.load((await fs.promises.readFile(path)).toString()) as DSL;
  }
  const client = new WorkflowClient(); // remember to configure Connection for production

  // Invoke the `DSLInterpreter` Workflow, only resolved when the workflow completes
  const result = await client.execute(DSLInterpreter, {
    args: [dslInput],
    taskQueue: 'dsl-interpreter',
    workflowId: 'my-dsl-id',
  });
  console.log(result); // Hello, Temporal!
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
