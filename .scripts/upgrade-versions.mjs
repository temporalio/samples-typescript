const glob = require('glob');

// Run with https://github.com/google/zx
const [scriptName, versionToSet] = process.argv.slice(2);
if (!versionToSet) {
  throw new Error(`Usage: ${scriptName} <version-to-set>`);
}

for (const packageJsonFile of await glob(`**/package.json`, { ignore: '**/node_modules/**' })) {
  console.log(`Processing ${packageJsonFile}`);

  const content = JSON.parse(await fs.readFile(packageJsonFile));
  const changed = replaceDeps({ content, fields: ['dependencies', 'devDependencies', 'resolutions'] });
  if (changed) {
    await fs.writeFile(packageJsonFile, JSON.stringify(content, null, 2));
  }
}

function replaceDeps({ content, fields }) {
  let changed = false;
  for (const field of fields) {
    for (const [dep, version] of Object.entries(content[field] ?? {})) {
      if (dep.startsWith('@temporalio/')) {
        if (version !== versionToSet) {
          content[field][dep] = versionToSet;
          console.log(`....Updated version for ${field} ${dep} from ${version} to ${versionToSet}`);
          changed = true;
        }
      }
    }
  }
  return changed;
}
