import globals from 'globals';
import pluginJs from '@eslint/js';
import stylisticJs from '@stylistic/eslint-plugin-js';
import jsdoc from 'eslint-plugin-jsdoc';

export default [{
        ignores: ['dist/**'],
    },
    {
        files: ['**/*.js'],
        languageOptions: { sourceType: 'commonjs' },
        plugins: {
            '@stylistic/js': stylisticJs,
            'jsdoc': jsdoc
        },
    },
    {
        files: ['bin/*.js'],
        languageOptions: { sourceType: 'module' },
    },
    {
        files: ['**/*.mjs'],
        languageOptions: { sourceType: 'module' },
        plugins: {
            '@stylistic/js': stylisticJs,
            'jsdoc': jsdoc
        },
    },
    {
        files: ['**/*.test.js', '**/*.test.mjs'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
                test: 'readonly',
                expect: 'readonly',
                beforeAll: 'readonly',
                afterAll: 'readonly',
                beforeEach: 'readonly',
                afterEach: 'readonly'
            }
        }
    },
    {
        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node
            }
        }
    },
    pluginJs.configs.recommended,

    // Rules to apply
    {
        rules: {
            'no-unused-vars': 'warn',
            'no-undef': 'warn',
            // Style
            '@stylistic/js/indent': 'off',
            'semi': 'warn',
            quotes: ['warn', 'single', {
                allowTemplateLiterals: true,
            }],
            'jsdoc/require-jsdoc': 'off',
            'jsdoc/require-description': 'off'
        },
    },
];
