import globals from 'globals';
import pluginJs from '@eslint/js';
import stylisticJs from '@stylistic/eslint-plugin-js';
import jsdoc from 'eslint-plugin-jsdoc';

export default [{
        files: ['**/*.js', '**/*.mjs'],
        languageOptions: { sourceType: 'commonjs' },
        plugins: {
            '@stylistic/js': stylisticJs,
            'jsdoc': jsdoc
        },
    },
    {
        languageOptions: { globals: globals.browser }
    },
    pluginJs.configs.recommended,

    // Rules to apply
    {
        rules: {
            'no-unused-vars': 'error',
            'no-undef': 'warn',
            // Style
            '@stylistic/js/indent': ['error', 4],
            'semi': 'error',
            quotes: ['error', 'single', {
                allowTemplateLiterals: true,
            }],
            'jsdoc/require-jsdoc': 'error',
            'jsdoc/require-description': 'error'
        },
    },
];