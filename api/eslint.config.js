// api/eslint.config.js
import { FlatCompat } from '@eslint/eslintrc'
import parser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import prettierPlugin from 'eslint-plugin-prettier'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// ESM’de __dirname elde etme
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// FlatCompat, legacy “plugin:@…” extends’lerini alıp Flat-Config’e dönüştürür
const compat = new FlatCompat({ baseDirectory: __dirname })

export default [
    // 1) TS ve Prettier recommended config’lerini al
    ...compat.extends(
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended'
    ),

    // 2) Projene özel parser ve kurallar
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

    // 3) TEST DOSYALARI İÇİN OVERRIDE
    {
        files: ['test/**/*.ts'],    // sadece api/test altındaki dosyalara etki eder
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',  // any hatasını kapat
        },
    },
]
