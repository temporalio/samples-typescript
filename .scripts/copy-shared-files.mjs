// Run with https://github.com/google/zx

const NON_SAMPLES = ['node_modules'];
const ADDITIONAL_SAMPLES = [];

// Some samples have different config files from those in .shared/
// that we don't want to overwrite
const TSCONFIG_EXCLUDE = ['nextjs-ecommerce-oneclick', 'fetch-esm'];
const GITIGNORE_EXCLUDE = ['nextjs-ecommerce-oneclick'];
const ESLINTRC_EXCLUDE = ['nextjs-ecommerce-oneclick', 'fetch-esm'];
const POST_CREATE_EXCLUDE = [
  'timer',
  'query-subscriptions',
  'nextjs-ecommerce-oneclick',
  'hello-world-mtls',
  'expense',
];

// By default, zx logs all commands spawned
$.verbose = false;

let [answer] = await question(
  `Running pre-commit hook.
This will overwrite any changes made to config files in samples (like ${chalk.bold('hello-world/tsconfig.json')}).
Proceed? [Y/n] `
);

if ((answer ?? 'y').toUpperCase() !== 'Y') {
  console.log(`To change config files, edit them in the ${chalk.bold('.shared/')} directory.\nAborting commit.`);
  process.exit(1);
}

const dirents = await fs.readdir('.', { withFileTypes: true });
const samples = dirents
  .filter((dirent) => dirent.isDirectory() && !NON_SAMPLES.includes(dirent.name) && dirent.name[0] !== '.')
  .map(({ name }) => name)
  .concat(ADDITIONAL_SAMPLES);

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

  if (!POST_CREATE_EXCLUDE.includes(sample)) {
    await copyAndAdd(sample, '.post-create');
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
