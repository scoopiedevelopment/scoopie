import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config({
  languageOptions: {
    parserOptions: {
      project: [
        './server/tsconfig.json',
        './client/tsconfig.json'
      ],
      tsconfigRootDir: process.cwd()
    }
  },
  files: ['**/*.ts'],
  extends: [
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintConfigPrettier
  ],
  rules: {
    'no-console': 'error',
    'no-useless-catch': 0,
    quotes: ['error', 'single', { allowTemplateLiterals: true }]
  }
});
