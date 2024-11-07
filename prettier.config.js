const config = {
    tabWidth: 4,
    singleQuote: true,
    parserOptions: {
        sourceType: 'module',
        ecmaVersion: 'latest',
    },
    plugins: ['simple-import-sort', 'import'],
    rules: {
        'simple-import-sort/imports': 'error',
        'simple-import-sort/exports': 'error',
        'import/first': 'error',
        'import/newline-after-import': 'error',
        'import/no-duplicates': 'error',
    },
};

export default config;
