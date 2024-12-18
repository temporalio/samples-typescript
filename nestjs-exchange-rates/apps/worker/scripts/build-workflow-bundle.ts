import { bundleWorkflowCode } from '@temporalio/worker';
import { readFile, writeFile } from 'fs/promises';
import * as path from 'path';

async function bundle() {
  const { code } = await bundleWorkflowCode({
    workflowsPath: require.resolve('../src/temporal/workflows'),
  });
  const tsconfigPath = path.join(__dirname, '../tsconfig.app.json');
  const tsconfigData = await readFile(tsconfigPath, 'utf-8');
  const tsconfig = JSON.parse(tsconfigData);
  const codePath = path.join(__dirname, `../${tsconfig.compilerOptions.outDir}/workflow-bundle.js`);

  await writeFile(codePath, code);
  console.log(`Bundle written to ${codePath}`);
}

bundle().catch((err) => {
  console.error(err);
  process.exit(0);
});
