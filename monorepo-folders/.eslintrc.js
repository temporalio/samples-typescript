module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  ignorePatterns: ['**/package/*.js', '**/package/*.ts'],
  parserOptions: {
    project: './tsconfig.json',
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
    'object-shorthand': ['error', 'always'],
    'deprecation/deprecation': 'warn',
  },
};
