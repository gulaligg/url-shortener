// api/eslint.config.js
import { FlatCompat } from '@eslint/eslintrc'
import pluginPrettier from 'eslint-plugin-prettier'
import pluginTs from '@typescript-eslint/eslint-plugin'

// FlatCompat, legacy "plugin:@…" extends’lerini Flat-Config’e çevirir
const compat = new FlatCompat({
    baseDirectory: __dirname,
})

export default [
    // önce TS önerilenleri ve Prettier Recommended’ı alalım
    ...compat.extends(
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended'
    ),
    {
        // sonra plugin modüllerini obje olarak tanımlayın
        plugins: {
            '@typescript-eslint': pluginTs,
            prettier: pluginPrettier,
        },
        // parser ve parserOptions da Flat-Config’te languageOptions içinde
        languageOptions: {
            parser: '@typescript-eslint/parser',
            parserOptions: {
                project: ['./tsconfig.json'],
                tsconfigRootDir: __dirname,
                ecmaVersion: 2020,
                sourceType: 'module',
            },
        },
        rules: {
            // Prettier hatalarını ESLint hatası olarak göster
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
]
