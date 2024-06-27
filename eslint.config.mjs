import globals from 'globals';
import pluginJs from '@eslint/js';
import stylisticJs from '@stylistic/eslint-plugin-js'

export default [{
        files: ['**/*.js'],
        languageOptions: { sourceType: 'commonjs' },
        plugins: {
            '@stylistic/js': stylisticJs
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
            }]
        },
    },
];