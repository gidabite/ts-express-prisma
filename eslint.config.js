import pluginJs from '@eslint/js';
import eslintConfigPrettier from 'eslint-config-prettier';
import globals from 'globals';
import tsEslint from 'typescript-eslint';

/** @type {import('eslint').Linter.Config[]} */
export default [
    { files: ['**/*.{js,mjs,cjs,ts}'] },
    { ignores: ['build/*'] },
    { languageOptions: { globals: globals.node } },
    pluginJs.configs.recommended,
    ...tsEslint.configs.recommended,
    eslintConfigPrettier,
];
