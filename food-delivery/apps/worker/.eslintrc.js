const { builtinModules } = require('module')

const ALLOWED_NODE_BUILTINS = new Set(['assert'])

module.exports = {
  root: true,
  extends: ['@fooddelivery/food'],
  overrides: [
    {
      files: ['src/workflows.ts', 'src/workflows-*.ts', 'src/workflows/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          ...builtinModules.filter((m) => !ALLOWED_NODE_BUILTINS.has(m)).flatMap((m) => [m, `node:${m}`]),
        ],
      },
    },
  ],
}
