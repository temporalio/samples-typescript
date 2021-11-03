import { bundleWorkflowCode } from '@temporalio/worker';
import { writeFile } from 'fs/promises';
import path from 'path';

async function bundle() {
  const { code } = await bundleWorkflowCode({
    workflowsPath: require.resolve('../src/workflows'),
  });

  await writeFile(path.join(__dirname, '../workflow-bundle.js'), code);

  console.log('Bundle written to workflow-bundle.js');
}

bundle();
