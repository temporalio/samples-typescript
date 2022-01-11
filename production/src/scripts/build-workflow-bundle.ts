import { bundleWorkflowCode } from '@temporalio/worker';
import { writeFile } from 'fs/promises';
import path from 'path';

async function bundle() {
  const { code } = await bundleWorkflowCode({
    workflowsPath: require.resolve('../workflows'),
  });
  const bundlePath = path.join(__dirname, '../../workflow-bundle.js');

  await writeFile(bundlePath, code);

  console.log(`Bundle written to ${bundlePath}`);
}

bundle().catch((err) => {
  console.error(err);
  process.exit(1);
});
