// Gets the configuration
import fs from 'fs';
import { __dirname } from './app_utils.mjs';
import { CONFIGURATION_FILE, DEFAULT_CONFIGURATION_FILE } from '../models/configuration.model.mjs';

// Check if config file exists
export const configFileExists = () => fs.existsSync(CONFIGURATION_FILE) ? true : false;

export const getConfigurationData = () => {
    if (configFileExists()) {
        return JSON.parse(fs.readFileSync(CONFIGURATION_FILE, { encoding: 'utf-8' }));
    } else {
        return JSON.parse(fs.readFileSync(`${__dirname}/../../${DEFAULT_CONFIGURATION_FILE}`, { encoding: 'utf-8' }));
    }
};

export const loadPlugins = (configFile) => {
    const { scripts } = configFile;

    // Scripts needed to be there and not to be empty
    if (!scripts || !Array.isArray(scripts)) {
        return {
            error: true,
            data: 'Scripts are not following the standard',
        };
    }

    return scripts
};