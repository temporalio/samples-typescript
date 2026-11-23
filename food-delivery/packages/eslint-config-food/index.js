module.exports = {
  extends: [
    'next',
    'prettier',
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
  rules: {
    '@next/next/no-html-link-for-pages': 'off',
    'react/jsx-key': 'off',
    '@typescript-eslint/no-deprecated': 'warn',

    // forgetting to await Activities and Workflow APIs is bad
    '@typescript-eslint/no-floating-promises': 'error',

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
  },
}
