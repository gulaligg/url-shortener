// eslint.config.js
module.exports = [
    // 1) Bu blok tüm .d.ts’leri lint’ten hariç tutar
    {
        ignores: ['src/@types/**/*.d.ts']
    },

    // 2) Mevcut kurallarınız
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
