import { bundleWorkflowCode } from '@temporalio/worker';
import { writeFile } from 'fs/promises';
import path from 'path';

async function bundle() {
  const { code, sourceMap } = await bundleWorkflowCode({
    workflowsPath: require.resolve('../workflows'),
  });
  const codePath = path.join(__dirname, '../../workflow-bundle.js');
  const sourceMapPath = `${codePath}.map`;

  await writeFile(codePath, code);
  await writeFile(sourceMapPath, sourceMap);

  console.log(`Bundle written to ${codePath} (source maps: ${sourceMapPath})`);
}

bundle().catch((err) => {
  console.error(err);
  process.exit(1);
});
