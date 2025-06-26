import { defineFlatConfig } from 'eslint-define-config'
import js from '@eslint/js'
import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'

export default defineFlatConfig([
    js.configs.recommended,
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                extraFileExtensions: ['.vue'],
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: { vue: vuePlugin },
        rules: {
            ...vuePlugin.configs['flat/vue3-essential'].rules,
        },
    },
    {
        files: ['**/*.ts'],
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
