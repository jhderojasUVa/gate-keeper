// Reponses of the server
// Libs
import { expressLog } from '../libs/log.mjs';
import { getConfigurationData, loadPlugins } from '../libs/load_config.mjs';
// Configuration
import { express_server, express_port, express_ws_port } from './server_conf.mjs';
import { startWebSocket } from './server_ws.mjs';

express_server.listen(express_port, () => {
    expressLog({
        message: `http server started at port ${express_port}`,
        kind: 'HTTP SERVER',
        severity: 'INFO'
    })
});

// Load configuration
const GATE_KEEPER_CONFIGURATION = getConfigurationData();
const GATE_KEEPER_PLUGINS = loadPlugins(GATE_KEEPER_CONFIGURATION);

// First start
// Load plugins
startWebSocket(express_ws_port);