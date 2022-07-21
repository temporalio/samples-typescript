// Run with https://github.com/google/zx
const STORED_SAMPLES = new Set(require('./list-of-samples.json').samples);

const NON_SAMPLES = ['node_modules'];
const ADDITIONAL_SAMPLES = [];

// Some samples have different config files from those in .shared/
// that we don't want to overwrite
const TSCONFIG_EXCLUDE = ['nextjs-ecommerce-oneclick', 'monorepo-folders', 'fetch-esm', 'production', 'hello-world-js'];
const GITIGNORE_EXCLUDE = [
  'nextjs-ecommerce-oneclick',
  'monorepo-folders',
  'production',
  'hello-world-js',
  'protobufs',
];
const ESLINTRC_EXCLUDE = ['nextjs-ecommerce-oneclick', 'monorepo-folders', 'fetch-esm', 'hello-world-js', 'protobufs'];
const ESLINTIGNORE_EXCLUDE = ['production', 'hello-world-js', 'protobufs', 'activities-examples'];

const POST_CREATE_EXCLUDE = [
  'timer-examples',
  'query-subscriptions',
  'nextjs-ecommerce-oneclick',
  'monorepo-folders',
  'hello-world-mtls',
  'expense',
  'production',
  'patching-api',
  'signals-queries',
  'activities-cancellation-heartbeating',
];

const FILES = [
  '.shared/tsconfig.json',
  '.shared/.gitignore',
  '.shared/.eslintrc.js',
  '.shared/.post-create',
  '.shared/.eslintignore',
  '.shared/.nvmrc',
  '.shared/.npmrc',
];
// By default, zx logs all commands spawned
$.verbose = false;
let numSharedFilesChanged = 0;
for (let i = 0; i < FILES.length; i++) {
  const checkForFiles = await $`git diff --shortstat ${FILES[i]}`;
  if (checkForFiles.stdout) {
    ++numSharedFilesChanged;
  }
}

const dirents = await fs.readdir('.', { withFileTypes: true });
const samples = dirents
  .filter((dirent) => dirent.isDirectory() && !NON_SAMPLES.includes(dirent.name) && dirent.name[0] !== '.')
  .map(({ name }) => name)
  .concat(ADDITIONAL_SAMPLES);

const hasNewSamples = samples.find((sample) => !STORED_SAMPLES.has(sample));
await fs.writeFile('./.scripts/list-of-samples.json', JSON.stringify({ samples }, null, '  '));
if (numSharedFilesChanged === 0 && !hasNewSamples) {
  process.exit(0);
}

await $`git add ${'./.scripts/list-of-samples.json'}`;

let [answer] = await question(
  `Running pre-commit hook.
This will overwrite changes made to most config files in samples (like ${chalk.bold('hello-world/tsconfig.json')}).
Proceed? [Y/n] `
);

if ((answer ?? 'y').toUpperCase() !== 'Y') {
  console.log(`To change config files, edit them in the ${chalk.bold('.shared/')} directory.\nAborting commit.`);
  process.exit(1);
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

  if (!POST_CREATE_EXCLUDE.includes(sample)) {
    await copyAndAdd(sample, '.post-create');
  }

  if (!ESLINTIGNORE_EXCLUDE.includes(sample)) {
    await copyAndAdd(sample, '.eslintignore');
  }

  await copyAndAdd(sample, '.npmrc');
  await copyAndAdd(sample, '.nvmrc');
  await copyAndAdd(sample, '.npmrc');
}

console.log(' done.');

async function copyAndAdd(sample, file) {
  await $`cp .shared/${file} ${sample}/`;
  await $`git add ${sample}/${file}`;
}
