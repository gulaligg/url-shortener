import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import { defineFlatConfig } from 'eslint/define-config'

export default defineFlatConfig([
    js.configs.recommended,
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vue.parsers['vue-eslint-parser'],
            parserOptions: {
                parser: tsParser,
                extraFileExtensions: ['.vue'],
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: ['./tsconfig.json'],
            },
        },
        processor: vue.processors['.vue'],
        plugins: { vue },
        rules: {
            ...vue.configs['vue3-essential'].rules,
        },
    },

    {
        files: ['**/*.ts', '**/*.vue'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
                project: ['./tsconfig.json'],
            },
        },
        plugins: { '@typescript-eslint': tsPlugin },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
        },
    },
])
