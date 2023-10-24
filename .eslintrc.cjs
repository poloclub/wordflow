/**
 * Copyright 2023 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:wc/recommended',
    'plugin:lit/recommended',
    'prettier'
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    tsconfigRootDir: __dirname,
    project: ['./tsconfig.json', './tsconfig.node.json'],
    extraFileExtensions: ['.cjs']
  },
  env: {
    es6: true,
    browser: true
  },
  plugins: ['lit', '@typescript-eslint', 'prettier'],
  ignorePatterns: ['node_modules'],
  rules: {
    indent: 'off',
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'single', { avoidEscape: true }],
    'prefer-const': ['error'],
    semi: ['error', 'always'],
    // 'max-len': [
    //   'warn',
    //   {
    //     code: 80
    //   }
    // ],
    'no-constant-condition': ['error', { checkLoops: false }],
    'prettier/prettier': 2,
    '@typescript-eslint/no-floating-promises': 'off',
    '@typescript-eslint/no-unsafe-return': 'off',
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/restrict-template-expressions': 'off',
    '@typescript-eslint/no-non-null-assertion': 'off',
    '@typescript-eslint/no-empty-function': 'off',
    '@typescript-eslint/no-unnecessary-type-assertion': 'off',
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }
    ],
    'no-self-assign': 'off'
  }
};
