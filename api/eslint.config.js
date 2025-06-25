const { FlatCompat } = require('@eslint/eslintrc')
const parser = require('@typescript-eslint/parser')
const tsPlugin = require('@typescript-eslint/eslint-plugin')
const prettierPlugin = require('eslint-plugin-prettier')
const compat = new FlatCompat({ baseDirectory: __dirname })

module.exports = [
    {
        ignores: ['src/@types/**/*.d.ts']
    },

    ...compat.extends(
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended'
    ),

    {
        languageOptions: {
            parser,
            parserOptions: {
                project: ['./tsconfig.json'],
                tsconfigRootDir: __dirname,
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            prettier: prettierPlugin,
        },
        rules: {
            'prettier/prettier': [
                'error',
                { singleQuote: true, semi: false, endOfLine: 'auto' },
            ],
            '@typescript-eslint/no-unused-vars': [
                'warn',
                { argsIgnorePattern: '^_' },
            ],
        },
    },

    {
        files: ['test/**/*.ts'],
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
]
