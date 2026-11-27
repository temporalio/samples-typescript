import { Client, Connection } from '@temporalio/client';
import { loadClientConnectConfig } from '@temporalio/envconfig';
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
        { activity: { name: 'activity1', arguments: { arg1: 'arg1' }, result: 'result1' } },
        { activity: { name: 'activity2', arguments: { arg: 'result1' }, result: 'result2' } },
        { activity: { name: 'activity3', arguments: { arg2: 'arg2', arg: 'result2' }, result: 'result3' } },
      ],
    },
  },
};

async function run() {
  const path = process.argv[2];
  if (path) {
    dslInput = yaml.load((await fs.promises.readFile(path)).toString()) as DSL;
  }
  const config = loadClientConnectConfig();
  const connection = await Connection.connect(config.connectionOptions);
  const client = new Client({ connection });

  // Invoke the `DSLInterpreter` Workflow, only resolved when the workflow completes
  await client.workflow.execute(DSLInterpreter, {
    args: [dslInput],
    taskQueue: 'dsl-interpreter',
    workflowId: 'my-dsl-id',
  });
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
