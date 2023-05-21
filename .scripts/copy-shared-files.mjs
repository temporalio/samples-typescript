// Run with https://github.com/google/zx
const STORED_SAMPLES = new Set(require('./list-of-samples.json').samples);

const yaml = require('yaml');

const NON_SAMPLES = ['node_modules'];
const ADDITIONAL_SAMPLES = [];

// Some samples have different config files from those in .shared/
// that we don't want to overwrite
const TSCONFIG_EXCLUDE = [
  'nextjs-ecommerce-oneclick',
  'monorepo-folders',
  'fetch-esm',
  'production',
  'hello-world-js',
  'food-delivery',
  'nestjs-exchange-rates',
];
const GITIGNORE_EXCLUDE = [
  'nextjs-ecommerce-oneclick',
  'monorepo-folders',
  'production',
  'hello-world-js',
  'protobufs',
  'food-delivery',
  'nestjs-exchange-rates',
];
const ESLINTRC_EXCLUDE = [
  'nextjs-ecommerce-oneclick',
  'monorepo-folders',
  'fetch-esm',
  'hello-world-js',
  'protobufs',
  'food-delivery',
  'nestjs-exchange-rates',
];
const ESLINTIGNORE_EXCLUDE = [
  'production',
  'hello-world-js',
  'protobufs',
  'activities-examples',
  'food-delivery',
  'nestjs-exchange-rates',
];

const POST_CREATE_EXCLUDE = [
  'schedules',
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
  'nestjs-exchange-rates',
  'food-delivery',
  'search-attributes',
];

const PRETTIERRC_EXCLUDE = ['food-delivery'];

const PRETTIERIGNORE_EXCLUDE = [
  'food-delivery',
  'monorepo-folders',
  'nextjs-ecommerce-oneclick',
  'protobufs',
  'nestjs-exchange-rates',
];

const NPMRC_EXCLUDE = ['food-delivery'];

const FILES = [
  '.shared/tsconfig.json',
  '.shared/.gitignore',
  '.shared/.eslintrc.js',
  '.shared/.post-create',
  '.shared/.eslintignore',
  '.shared/.nvmrc',
  '.shared/.npmrc',
  '.shared/.prettierrc',
  '.shared/.prettierignore',
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

  if (!NPMRC_EXCLUDE.includes(sample)) {
    await copyAndAdd(sample, '.npmrc');
  }

  if (!PRETTIERRC_EXCLUDE.includes(sample)) {
    await copyAndAdd(sample, '.prettierrc');
  }

  if (!PRETTIERIGNORE_EXCLUDE.includes(sample)) {
    await copyAndAdd(sample, '.prettierignore');
  }

  await copyAndAdd(sample, '.nvmrc');
}

process.stdout.write('Updating GitHub workflows...');

const ciConfig = yaml.parseDocument(await fs.readFile('.github/workflows/ci.yml', 'utf8'));
const jobsNode = ciConfig.contents.items.find((i) => i.key.value === 'jobs');
const testNode = jobsNode.value.items.find((i) => i.key.value === 'test-individual');
const testProjectsNode = testNode.value.items
  .find((i) => i.key.value === 'strategy')
  .value.items.find((i) => i.key.value === 'matrix')
  .value.items.find((i) => i.key.value === 'project');
const lintNode = jobsNode.value.items.find((i) => i.key.value === 'lint-individual');
const lintProjectsNode = lintNode.value.items
  .find((i) => i.key.value === 'strategy')
  .value.items.find((i) => i.key.value === 'matrix')
  .value.items.find((i) => i.key.value === 'project');

testProjectsNode.value.items = [];
lintProjectsNode.value.items = [];

for (const sample of samples) {
  const hasTestScript = !!require(`../${sample}/package.json`).scripts.test;
  const hasLintScript = !!require(`../${sample}/package.json`).scripts.lint;

  if (hasTestScript) {
    testProjectsNode.value.items.push(sample);
  }
  if (hasLintScript) {
    lintProjectsNode.value.items.push(sample);
  }
}

await fs.writeFile('.github/workflows/ci.yml', ciConfig.toString());

console.log(' done.');

async function copyAndAdd(sample, file) {
  await $`cp .shared/${file} ${sample}/`;
  await $`git add ${sample}/${file}`;
}
