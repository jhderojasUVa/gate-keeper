// Gate-keeper initialization tool
import fs from 'fs';
import { __dirname } from './libs/app_utils.mjs';
// Libs
import { configFileExists } from './libs/load_config.mjs';
// Extras
import { CONFIGURATION_FILE, DEFAULT_CONFIGURATION_FILE } from './models/configuration.model.mjs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

/**
 * Initializes the Gate Keeper by checking for and creating the configuration file if it doesn't exist.
 * @returns {boolean} True if the configuration file was created, false if it already exists.
 */
export const initGateKepper = () => {
    // If the configuration file doesn't exists create a new one
    console.log('Checking if configuration file is present...');

    if (!configFileExists()) {
        console.log('== Configuration file is not present, creating default one...');
        fs.copyFileSync(`${__dirname}/../../${DEFAULT_CONFIGURATION_FILE}`, CONFIGURATION_FILE);
        console.log('== File created!');
        return true;
    } else {
        console.log('== Sorry: Configuration file exists...');
        return false;
    }
}

// Execute if run directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const openBrowser = process.argv.includes('--open');
    initGateKepper();
    if (openBrowser) {
        const protocol = process.env.GATE_KEEPER_HTTPS !== 'false' ? 'https' : 'http';
        const port = process.env.GATE_KEEPER_PORT || 9000;
        const url = `${protocol}://localhost:${port}`;
        let command;
        if (process.platform === 'darwin') {
            command = `open "${url}"`;
        } else if (process.platform === 'win32') {
            command = `start "${url}"`;
        } else {
            command = `xdg-open "${url}"`;
        }
        exec(command, (error) => {
            if (error) {
                console.error('Failed to open browser:', error);
            }
        });
    }
}