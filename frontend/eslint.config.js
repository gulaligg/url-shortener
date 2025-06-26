// eslint.config.js
import js from '@eslint/js'
import vue from 'eslint-plugin-vue'
import vueParser from 'vue-eslint-parser'
import tsParser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import globals from 'globals'

/** @type {import('eslint').FlatConfig[]} */
export default [
    /* JS-genel kurallar */
    js.configs.recommended,

    /* Tarayıcı + Node global’leri */
    {
        files: ['**/*.{js,ts,vue}'],
        languageOptions: {
            globals: { ...globals.browser, ...globals.node },
        },
    },

    /* Vue dosyaları */
    {
        files: ['**/*.vue'],
        languageOptions: {
            parser: vueParser,
            parserOptions: { parser: tsParser, extraFileExtensions: ['.vue'] },
        },
        plugins: { vue },
        ...vue.configs['flat/vue3-essential'],
    },

    /* TypeScript dosyaları */
    {
        files: ['**/*.ts'],
        languageOptions: {
            parser: tsParser,
            parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
        },
        plugins: { '@typescript-eslint': tsPlugin },
        rules: {
            ...tsPlugin.configs.recommended.rules,
            '@typescript-eslint/no-explicit-any': ['warn', { ignoreRestArgs: true }],
        },
    },
]
