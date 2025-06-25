// .eslintrc.js
export default {
    root: true,

    parser: '@typescript-eslint/parser',
    parserOptions: {
        project: ['./tsconfig.json'],
        tsconfigRootDir: __dirname,
        ecmaVersion: 2020,
        sourceType: 'module',
    },

    plugins: [
        '@typescript-eslint',
        'prettier',
    ],

    extends: [
        'plugin:@typescript-eslint/recommended',
        'plugin:prettier/recommended',
    ],

    rules: {
        'prettier/prettier': ['error', {
            singleQuote: true,
            semi: false,
            endOfLine: 'auto',
        }],
        '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
    },
}
