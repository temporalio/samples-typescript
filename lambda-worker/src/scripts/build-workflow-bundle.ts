import { makeOtelPlugin } from '@temporalio/lambda-worker/otel';
import { bundleWorkflowCode } from '@temporalio/worker';
import { writeFile } from 'fs/promises';
import path from 'path';

async function bundle() {
  // Pass OTel plugins so workflow interceptor modules are included in the bundle.
  const { plugin, spanProcessor } = makeOtelPlugin();

  const { code } = await bundleWorkflowCode({
    workflowsPath: require.resolve('../workflows'),
    plugins: [plugin],
  });
  const codePath = path.join(__dirname, '../../workflow-bundle.js');

  await writeFile(codePath, code);
  console.log(`Bundle written to ${codePath}`);
}

bundle().catch((err) => {
  console.error(err);
  process.exit(1);
});
