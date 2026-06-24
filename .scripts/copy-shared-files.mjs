// Run with https://github.com/google/zx
const { readFileSync } = require('fs');

const STORED_SAMPLES = new Set(require('./list-of-samples.json').samples);

const yaml = require('yaml');

const NON_SAMPLES = ['node_modules'];
const ADDITIONAL_SAMPLES = [];

// Some directories contain one or more samples nested in them instead of having
// a package.json. These are treated as NON_SAMPLES, but child directories are added
// as samples.
const HAS_CHILD_SAMPLES = [
  'message-passing',
  'polling',
];

// Some samples have different config files from those in .shared/
// that we don't want to overwrite
const TSCONFIG_EXCLUDE = [
  'nextjs-ecommerce-oneclick',
  'monorepo-folders',
  'fetch-esm',
  'production',
  'hello-world-js',
  'food-delivery',
  'lambda-worker',
  'nestjs-exchange-rates',
  'empty',
  'hello-world',
  'scratchpad',
];
const GITIGNORE_EXCLUDE = [
  'nextjs-ecommerce-oneclick',
  'monorepo-folders',
  'production',
  'hello-world-js',
  'protobufs',
  'food-delivery',
  'lambda-worker',
  'nestjs-exchange-rates',
];
const ESLINTRC_EXCLUDE = [
  'openai-agents',
  'nextjs-ecommerce-oneclick',
  'monorepo-folders',
  'fetch-esm',
  'hello-world-js',
  'protobufs',
  'food-delivery',
  'nestjs-exchange-rates',
  'workflow-streams',
];
const ESLINTIGNORE_EXCLUDE = [
  'production',
  'hello-world-js',
  'protobufs',
  'activities-examples',
  'food-delivery',
  'nestjs-exchange-rates',
  'eager-workflow-start',
  'sleep-for-days',
];

const POST_CREATE_EXCLUDE = [
  'openai-agents',
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
  'lambda-worker',
  'nestjs-exchange-rates',
  'food-delivery',
  'search-attributes',
  'worker-versioning',
  'empty',
  'scratchpad',
  'workflow-streams',
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


// Collect all samples that are children of dirs specified in HAS_CHILD_SAMPLES
const childSamples = await Promise.all(HAS_CHILD_SAMPLES.map(async (dirName) => {
  const dirents = await fs.readdir(`./${dirName}`, { withFileTypes: true});
  return dirents.filter((dirent) => dirent.isDirectory()).map(({name}) => `${dirName}/${name}`);
})).then((samples) => {
  return samples.reduce((accum, cur) => accum.concat(cur), []);
});

// Read the repo directory to find all samples
const dirents = await fs.readdir('.', { withFileTypes: true });

// Filter out dirs specified NON_SAMPLES and HAS_CHILD_SAMPLES.
// Include dirs specified as ADDITIONAL_SAMPLES and the child directories
// of the dirs specified in HAS_CHILD_SAMPLES.
const resolvedNonSamples = NON_SAMPLES.concat(HAS_CHILD_SAMPLES);
const samples = dirents
  .filter((dirent) => dirent.isDirectory() && !resolvedNonSamples.includes(dirent.name) && dirent.name[0] !== '.')
  .map(({ name }) => name)
  .concat(ADDITIONAL_SAMPLES, childSamples);

const hasNewSamples = samples.find((sample) => !STORED_SAMPLES.has(sample));
await fs.writeFile('./.scripts/list-of-samples.json', JSON.stringify({ samples }, null, '  '));
if (numSharedFilesChanged === 0 && !hasNewSamples) {
  process.exit(0);
}

await $`git add ${'./.scripts/list-of-samples.json'}`;

let answer;
// Only prompt when stdin is a terminal — in non-interactive runs (Claude Code, CI,
// git hooks where stdin carries ref data), proceed with the default.
if (process.stdin.isTTY) {
  [answer] = await question(
    `Running pre-commit hook.
This will overwrite changes made to most config files in samples (like ${chalk.bold('hello-world/tsconfig.json')}).
Proceed? [Y/n] `
  );
}

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

testProjectsNode.value.items = [];

for (const sample of samples) {
  // Don't use require, because it won't work with ESM samples
  const packageJson = JSON.parse(readFileSync(`./${sample}/package.json`));
  const hasTestScript = !!packageJson.scripts.test;

  if (hasTestScript) {
    testProjectsNode.value.items.push(sample);
  } else {
    const index = testProjectsNode.value.items.indexOf(sample);
    if (index >= 0) {
      testProjectsNode.value.items.splice(index, 1);
    }
  }
}

await fs.writeFile('.github/workflows/ci.yml', ciConfig.toString());

console.log(' done.');

async function copyAndAdd(sample, file) {
  await $`cp .shared/${file} ${sample}/`;
  await $`git add ${sample}/${file}`;
}
