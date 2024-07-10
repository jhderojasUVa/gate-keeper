// Gets the configuration
import fs from 'fs';
import { __dirname } from './app_utils.mjs';

// Check if config file exists
const configFileExists = () => {
    if (fs.existsSync('gate-keeper.json')) {
        return true;
    }

    return false;
};

export const getConfigurationData = () => {
    if (configFileExists()) {
        return JSON.parse(fs.readFileSync(`gate-keeper.json`, { encoding: 'utf-8' }));
    } else {
        return JSON.parse(fs.readFileSync(`${__dirname}/../../default.gate-keeper.json`, { encoding: 'utf-8' }));
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