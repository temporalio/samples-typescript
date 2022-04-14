module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint', 'deprecation'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    // recommended for safety
    '@typescript-eslint/no-floating-promises': 'error', // forgetting to await Activities and Workflow APIs is bad
    'deprecation/deprecation': 'warn',

    // code style preference
    'object-shorthand': ['error', 'always'],

    // relaxed rules, for convenience
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
  },
  overrides: [
    {
      files: ['src/workflows.ts', 'src/workflows-*.ts', 'src/workflows/*.ts'],
      rules: {
        'no-restricted-imports': [
          'error',
          'async_hooks',
          'buffer',
          'child_process',
          'cluster',
          'console',
          'constants',
          'crypto',
          'dgram',
          'diagnostics_channel',
          'dns',
          'dns/promises',
          'domain',
          'events',
          'fs',
          'fs/promises',
          'http',
          'http2',
          'https',
          'inspector',
          'module',
          'net',
          'os',
          'path',
          'path/posix',
          'path/win32',
          'perf_hooks',
          'process',
          'punycode',
          'querystring',
          'readline',
          'repl',
          'stream',
          'stream/promises',
          'stream/web',
          'string_decoder',
          'sys',
          'timers',
          'timers/promises',
          'tls',
          'trace_events',
          'tty',
          'url',
          'util',
          'util/types',
          'v8',
          'vm',
          'wasi',
          'worker_threads',
          'zlib',
        ],
      }
    }
  ]
};