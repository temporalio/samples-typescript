module.exports = {
  env: {
    node: true,
  },
  plugins: ['import'],
  parserOptions: {
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  extends: ['eslint:recommended', 'prettier'],
  rules: {
    'object-shorthand': ['error', 'always'],
  },
};
