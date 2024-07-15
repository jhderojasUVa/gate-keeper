#!/usr/bin/env node

// Reponses of the server
// Libs
import { expressLog } from '../libs/log.mjs';
import { getConfigurationData, loadPlugins } from '../libs/load_config.mjs';
import { executeAllScripts } from '../libs/execute_scripts.mjs';
// Models
import { GATE_KEEPER_CONFIG_MODEL as CONFIG_MODEL } from '../models/configuration.model.mjs';
// State
import { STATE as GATE_KEEPER_STATE } from '../libs/state.mjs';
// Configuration
import { express_server, express_port, express_ws_port } from './server_conf.mjs';
import { startWebSocket } from './server_ws.mjs';

express_server.listen(express_port, () => {
    expressLog({
        message: `http server started at port ${express_port}`,
        kind: 'HTTP SERVER',
        severity: 'INFO'
    });
});

// Load configuration
const GATE_KEEPER_CONFIG_MODEL = getConfigurationData();
const GATE_KEEPER_PLUGINS = loadPlugins(GATE_KEEPER_CONFIG_MODEL);

// First start and check
// set the results and update the can commit
GATE_KEEPER_STATE.setResults(executeAllScripts(GATE_KEEPER_PLUGINS)).updateCanCommit();

startWebSocket(express_ws_port);