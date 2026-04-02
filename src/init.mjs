#!/usr/bin/env node

// Gate-keeper initialization tool
import fs from 'fs';
import { __dirname } from './libs/app_utils.mjs';
// Libs
import { configFileExists } from './libs/load_config.mjs';
// Extras
import { CONFIGURATION_FILE, DEFAULT_CONFIGURATION_FILE } from './models/configuration.model.mjs';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

// Determine if running as main module (works for npm-linked commands)
const currentFileUrl = import.meta.url;
const currentFilePath = fileURLToPath(currentFileUrl);
const isMainModule = process.argv[1].includes('gate-keeper-init') || process.argv[1] === currentFilePath;

// Ensure stdout is flushed immediately
const log = (msg) => {
    console.log(msg);
    fs.writeSync(1, '');
};

/**
 * Shows help information
 */
export const showHelp = () => {
    log(`
Gate Keeper Init - Configuration Setup

Usage: gate-keeper-init [options]

Options:
  --help, -h    Show this help message
  --open        Open browser to the web interface after initialization
  --version, -v Show version information

Environment Variables:
  GATE_KEEPER_PORT     HTTP/HTTPS port (default: 9000)
  GATE_KEEPER_WS_PORT  WebSocket port (default: 9001)
  GATE_KEEPER_HTTPS    Enable HTTPS (default: true)

Examples:
  gate-keeper-init              Initialize configuration
  gate-keeper-init --open       Initialize and open browser
  GATE_KEEPER_PORT=8080 gate-keeper-init  Initialize with custom port

For more information, see: https://github.com/jhderojasUVa/gate-keeper
`);
};

/**
 * Shows version information
 */
export const showVersion = () => {
    try {
        const packageJson = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
        log(`Gate Keeper v${packageJson.version}`);
    } catch (error) {
        log('Gate Keeper (version unknown)');
    }
};

/**
 * Initializes the Gate Keeper by checking for and creating the configuration file if it doesn't exist.
 * @returns {boolean} True if the configuration file was created, false if it already exists.
 */
export const initGateKepper = () => {
    try {
        log('🚀 Initializing Gate Keeper...');
        log('📋 Checking if configuration file is present...');

        if (!configFileExists()) {
            log('⚠️  Configuration file not found. Creating default one...');
            try {
                fs.copyFileSync(`${__dirname}/../../${DEFAULT_CONFIGURATION_FILE}`, CONFIGURATION_FILE);
                log('✅ Configuration file created successfully!');
                log(`   Location: ${CONFIGURATION_FILE}`);
                log('   You can now customize it to add your own scripts.');
                return true;
            } catch (error) {
                log(`❌ Error creating configuration file: ${error.message}`);
                process.exit(1);
            }
        } else {
            log('✅ Configuration file already exists.');
            log(`   Location: ${CONFIGURATION_FILE}`);
            return false;
        }
    } catch (error) {
        log(`❌ Error during initialization: ${error.message}`);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
};

// Execute if run directly (not imported as a module)
// Check if running as main - works for both direct execution and npm-linked commands
if (isMainModule) {
    const args = process.argv.slice(2);

    if (args.includes('--help') || args.includes('-h')) {
        showHelp();
        process.exit(0);
    }

    if (args.includes('--version') || args.includes('-v')) {
        showVersion();
        process.exit(0);
    }

    const openBrowser = args.includes('--open');

    // Check for invalid arguments
    const validArgs = ['--open'];
    const invalidArgs = args.filter(arg => !validArgs.includes(arg));
    if (invalidArgs.length > 0) {
        log(`❌ Unknown argument(s): ${invalidArgs.join(', ')}`);
        log('   Use --help for usage information.');
        process.exit(1);
    }

    try {
        initGateKepper();

        if (openBrowser) {
            const protocol = process.env.GATE_KEEPER_HTTPS !== 'false' ? 'https' : 'http';
            const port = process.env.GATE_KEEPER_PORT || 9000;
            const url = `${protocol}://localhost:${port}`;
            log(`🌐 Opening browser to ${url}...`);
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
                    log(`⚠️  Failed to open browser: ${error.message}`);
                }
            });
        }

        log('\n✨ Gate Keeper is now ready! Run "gate-keeper" to start.');
    } catch (error) {
        log(`❌ Fatal error: ${error.message}`);
        if (error.stack) {
            console.error(error.stack);
        }
        process.exit(1);
    }
}