#!/usr/bin/env node

import { launchCli } from './launch-cli.js';

launchCli({
    commandName: 'gate-keeper-init',
    targetRelativePath: '../dist/init.js',
});
