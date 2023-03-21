module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    'no-constant-condition': ['error', { checkLoops: false }],
    '@typescript-eslint/no-inferrable-types': 'off',
  },
};
