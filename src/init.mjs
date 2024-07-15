// Gate-keeper initialization tool
import fs from 'fs';
import { __dirname } from './libs/app_utils.mjs';
// Libs
import { configFileExists } from './libs/load_config.mjs';
// Extras
import { CONFIGURATION_FILE, DEFAULT_CONFIGURATION_FILE } from './models/configuration.model.mjs';

export const initGateKepper = () => {
    // If the configuration file doesn't exists create a new one
    console.log('Checking if configuration file is present...');

    if (!configFileExists()) {
        console.log('== Configuration file is not present, creating default one...');
        fs.copyFileSync(`${__dirname}/../../${DEFAULT_CONFIGURATION_FILE}`, CONFIGURATION_FILE);
        console.log('== File created!');
    } else {
        console.log('== Sorry: Configuration file exists, exiting...');
        process.exit(1);
    }
}