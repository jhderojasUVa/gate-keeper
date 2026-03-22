// Configuration model

/**
 * The standard expected name for the configuration file.
 * @type {string}
 */
export const CONFIGURATION_FILE = 'gate-keeper.conf.json';

/**
 * The fallback standard name for the configuration file if the configured one is missing.
 * @type {string}
 */
export const DEFAULT_CONFIGURATION_FILE = 'default.gate-keeper.conf.json';

/**
 * Base template for a script execution model.
 * @type {{ name: (string|undefined), command: (string|undefined), data: (string|undefined), result: (string|undefined) }}
 */
export let SCRIPT_MODEL = {
    name: undefined,
    command: undefined,
    data: undefined,
    result: undefined,
};

/**
 * Global Gatekeeper configuration model base instance.
 * Contains ports, host assignments, and scripts list.
 * @type {{ port: (number|undefined), host: (string|undefined), scripts: Array<typeof SCRIPT_MODEL> }}
 */
export let GATE_KEEPER_CONFIG_MODEL = {
    port: undefined,
    host: undefined,
    scripts: [SCRIPT_MODEL],
};