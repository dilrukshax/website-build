/** @type {import('eslint').Linter.Config} */
module.exports = {
    parser: '@typescript-eslint/parser',
    plugins: ['@typescript-eslint'],
    extends: [
        'eslint:recommended',
        'plugin:@typescript-eslint/recommended',
        'plugin:@typescript-eslint/recommended-requiring-type-checking',
    ],
    rules: {
        // Enforce no console.log in production code — use structured logger
        'no-console': 'warn',
        // No any — use unknown and narrow properly
        '@typescript-eslint/no-explicit-any': 'error',
        // Enforce explicit return types on all functions
        '@typescript-eslint/explicit-function-return-type': ['error', {
            allowExpressions: true,
            allowTypedFunctionExpressions: true,
        }],
        // No floating promises — all async operations must be awaited
        '@typescript-eslint/no-floating-promises': 'error',
        // Consistent import ordering (requires eslint-plugin-import)
        'import/order': 'off',
    },
    ignorePatterns: ['dist/', 'node_modules/', '.next/', '*.js', '*.cjs'],
};
