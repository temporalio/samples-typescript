const NON_SAMPLES = ['node_modules'];
const TSCONFIG_EXCLUDE = ['fetch-esm'];
const GITIGNORE_EXCLUDE = ['ecommerce-one-click/nextjs'];
const ESLINTRC_EXCLUDE = ['ecommerce-one-click/nextjs'];

$.verbose = false;

let answer = await question(
  `Running pre-commit hook.
This will overwrite any changes made to config files in samples (like ${chalk.bold('hello-world/tsconfig.json')}).
Proceed? [Y/n] `
);

if (answer[0].toUpperCase() !== 'Y') {
  console.log(`To change config files, edit them in the ${chalk.bold('.shared/')} directory.\nAborting commit.`);
  process.exit(1);
}

const dirents = await fs.readdir('.', { withFileTypes: true });
const directories = dirents.filter(
  (dirent) => dirent.isDirectory() && !NON_SAMPLES.includes(dirent.name) && dirent.name[0] !== '.'
);

const samples = [];
for (const dir of directories) {
  try {
    await fs.access(dir.name + '/package.json');
    samples.push(dir.name);
  } catch (error) {
    if (error.code === 'ENOENT') {
      // There's no package.json. Add the subdirectories as samples.
      const subdirectories = fs.readdirSync(dir.name, { withFileTypes: true }).filter((dirent) => dirent.isDirectory());
      samples.push(...subdirectories.map((dirent) => `${dir.name}/${dirent.name}`));
    } else {
      throw error;
    }
  }
}

process.stdout.write('Copying config files from .shared/ to samples...');

for (const sample of samples) {
  if (!TSCONFIG_EXCLUDE.includes(sample)) {
    await copyAndAdd(sample, 'tsconfig.json');
  }

  if (!GITIGNORE_EXCLUDE.includes(sample)) {
    await copyAndAdd(sample, '.gitignore');
  }

  if (!ESLINTRC_EXCLUDE.includes(sample)) {
    await copyAndAdd(sample, '.eslintrc.js');
  }

  await copyAndAdd(sample, '.eslintignore');
  await copyAndAdd(sample, '.npmrc');
  await copyAndAdd(sample, '.nvmrc');
}

console.log(' done.');

async function copyAndAdd(sample, file) {
  await $`cp .shared/${file} ${sample}/`;
  await $`git add ${sample}/${file}`;
}
