#!/usr/bin/env node

import { launchCli } from './launch-cli.js';

launchCli({
    commandName: 'gate-keeper',
    targetRelativePath: '../dist/server/index.js',
});
