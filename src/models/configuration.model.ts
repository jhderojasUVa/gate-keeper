// Configuration model

/**
 * The standard expected name for the configuration file.
 */
export const CONFIGURATION_FILE = 'gate-keeper.conf.json';

/**
 * The fallback standard name for the configuration file if the configured one is missing.
 */
export const DEFAULT_CONFIGURATION_FILE = 'default.gate-keeper.conf.json';

/**
 * Base template for a script execution model.
 */
export interface ScriptModel {
    name: string | undefined;
    command: string | undefined;
    data: string | undefined;
    result: string | boolean | undefined;
}

/**
 * Global Gatekeeper configuration model.
 */
export interface GateKeeperConfigModel {
    port: number | undefined;
    host: string | undefined;
    scripts: ScriptModel[];
}

/**
 * Base template for a script execution model instance.
 */
export let SCRIPT_MODEL: ScriptModel = {
    name: undefined,
    command: undefined,
    data: undefined,
    result: undefined,
};

/**
 * Global Gatekeeper configuration model base instance.
 */
export let GATE_KEEPER_CONFIG_MODEL: GateKeeperConfigModel = {
    port: undefined,
    host: undefined,
    scripts: [SCRIPT_MODEL],
};
