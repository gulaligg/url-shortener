// eslint.config.js  – Flat config / ESM
import js from '@eslint/js'
import vuePlugin from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import globals from 'globals'

/** @type {import('eslint').FlatConfig[]} */
export default [
    /* Ortak ayarlar -------------------------------------------------------- */
    {
        ignores: ['dist/**', 'node_modules/**'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: { ...globals.browser, ...globals.node },
        },
    },

    /* JS önerilen kurallar ------------------------------------------------- */
    js.configs.recommended,

    /* Vue dosyaları -------------------------------------------------------- */
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: {
                parser: tsParser,
                extraFileExtensions: ['.vue'],
            },
        },
        plugins: { vue: vuePlugin },
        ...vuePlugin.configs['flat/vue3-essential'],
    },

    /* TypeScript dosyaları ------------------------------------------------- */
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: { '@typescript-eslint': tsPlugin },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': [
                'warn',
                { ignoreRestArgs: true },
            ],
        },
    },
]
