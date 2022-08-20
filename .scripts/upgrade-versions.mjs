// Run with https://github.com/google/zx
const STORED_SAMPLES = new Set(require('./list-of-samples.json').samples);
const packageDirs = STORED_SAMPLES;
packageDirs.add('monorepo-folders/packages/temporal-workflows');

const [scriptName, versionToSet] = process.argv.slice(2);
if (!versionToSet) {
  throw new Error(`Usage: ${scriptName} <version-to-set>`);
}

for (const sample of STORED_SAMPLES) {
  const packagePath = path.join(sample, 'package.json');
  const content = JSON.parse(await fs.readFile(packagePath));
  let changed = false;
  for (const [dep, version] of Object.entries(content.dependencies)) {
    if (dep.startsWith('@temporalio/')) {
      if (version !== versionToSet) {
        content.dependencies[dep] = versionToSet;
        console.log(`Updated version for ${sample} dependency ${dep} from ${version} to ${versionToSet}`);
        changed = true;
      }
    }
  }
  for (const [dep, version] of Object.entries(content.devDependencies)) {
    if (dep.startsWith('@temporalio/')) {
      if (version !== versionToSet) {
        content.devDependencies[dep] = versionToSet;
        console.log(`Updated version for ${sample} devDependency ${dep} from ${version} to ${versionToSet}`);
        changed = true;
      }
    }
  }
  if (changed) {
    await fs.writeFile(packagePath, JSON.stringify(content));
  } else {
    console.log(`Version up to date for ${sample}`);
  }
}
