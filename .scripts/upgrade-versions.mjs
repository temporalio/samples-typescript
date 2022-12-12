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
  const changed =
    replaceDeps({ content, sample, field: 'dependencies' }) ||
    replaceDeps({ content, sample, field: 'devDependencies' }) ||
    replaceDeps({ content, sample, field: 'resolutions' });
  if (changed) {
    await fs.writeFile(packagePath, JSON.stringify(content, null, 2));
  } else {
    console.log(`Version up to date for ${sample}`);
  }
}

function replaceDeps({ content, sample, field }) {
  let changed = false;
  for (const [dep, version] of Object.entries(content[field] ?? {})) {
    if (dep.startsWith('@temporalio/')) {
      if (version !== versionToSet) {
        content[field][dep] = versionToSet;
        console.log(`Updated version for ${sample} ${field} ${dep} from ${version} to ${versionToSet}`);
        changed = true;
      }
    }
  }
  return changed;
}
