import globals from "globals";
import pluginJs from "@eslint/js";


export default [
    { files: ["**/*.js"], languageOptions: { sourceType: "commonjs" } },
    { languageOptions: { globals: globals.browser } },
    pluginJs.configs.recommended,

    // Rules to apply
    {
        rules: {
            'no-unused-vars': 'error',
            'no-undef': 'warn',
        },
    },
];