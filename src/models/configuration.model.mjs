// Configuration model

export const CONFIGURATION_FILE = 'gate-keeper.conf.json';
export const DEFAULT_CONFIGURATION_FILE = 'default.gate-keeper.conf.json';

export let SCRIPT_MODEL = {
    name: undefined,
    command: undefined,
    data: undefined,
    result: undefined,
};

export let GATE_KEEPER_CONFIG_MODEL = {
    port: undefined,
    host: undefined,
    scripts: [SCRIPT_MODEL],
};