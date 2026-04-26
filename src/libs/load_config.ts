// Gets the configuration
import fs from 'fs';
import { __dirname } from './app_utils.js';
import { CONFIGURATION_FILE, DEFAULT_CONFIGURATION_FILE } from '../models/configuration.model.js';
import type { GateKeeperConfigModel, ScriptModel } from '../models/configuration.model.js';

// Check if config file exists
export const configFileExists = (): boolean => fs.existsSync(CONFIGURATION_FILE) ? true : false;

export const getConfigurationData = (): GateKeeperConfigModel => {
    if (configFileExists()) {
        return JSON.parse(fs.readFileSync(CONFIGURATION_FILE, { encoding: 'utf-8' })) as GateKeeperConfigModel;
    } else {
        return JSON.parse(fs.readFileSync(`${__dirname}/../../${DEFAULT_CONFIGURATION_FILE}`, { encoding: 'utf-8' })) as GateKeeperConfigModel;
    }
};

interface LoadPluginsError {
    error: true;
    data: string;
}

export const loadPlugins = (configFile: GateKeeperConfigModel): ScriptModel[] | LoadPluginsError => {
    const { scripts } = configFile;

    // Scripts needed to be there and not to be empty
    if (!scripts || !Array.isArray(scripts)) {
        return {
            error: true,
            data: 'Scripts are not following the standard',
        };
    }

    return scripts;
};
