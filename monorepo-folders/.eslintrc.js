module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['**/package/*.js', '**/package/*.ts'],
  parserOptions: {
    project: './packages/*/tsconfig.json',
    tsconfigRootDir: __dirname,
    include: ['packages/*'],
  },
  plugins: ['@typescript-eslint', 'deprecation'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier',
  ],
  rules: {
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'off',
    '@typescript-eslint/no-floating-promises': 'error',
    'object-shorthand': ['error', 'always'],
    'deprecation/deprecation': 'warn',
  },
};
