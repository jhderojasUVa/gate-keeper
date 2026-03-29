import { startGateKeeper } from '../../src/server/index.mjs';

// Mock all dependencies
jest.mock('../../src/libs/log.mjs', () => ({
    expressLog: jest.fn()
}));

jest.mock('../../src/libs/load_config.mjs', () => ({
    getConfigurationData: jest.fn(),
    loadPlugins: jest.fn(),
    configFileExists: jest.fn()
}));

jest.mock('../../src/libs/execute_scripts.mjs', () => ({
    executeAllScripts: jest.fn()
}));

jest.mock('../../src/libs/state.mjs', () => ({
    STATE: {
        isWorking: jest.fn(),
        updateCanCommit: jest.fn(),
        canCommit: true,
        scripts: []
    }
}));

jest.mock('../../src/server/server_conf.mjs', () => ({
    express_server: {
        listen: jest.fn((port, callback) => callback()),
        on: jest.fn()
    },
    express_port: 9000,
    express_ws_port: 9001,
    isHTTPS: true
}));

jest.mock('../../src/server/server_ws.mjs', () => ({
    startWebSocket: jest.fn(),
    broadcast: jest.fn()
}));

describe('Server Index', () => {
    const { expressLog } = require('../../src/libs/log.mjs');
    const { getConfigurationData, loadPlugins, configFileExists } = require('../../src/libs/load_config.mjs');
    const { executeAllScripts } = require('../../src/libs/execute_scripts.mjs');
    const { STATE } = require('../../src/libs/state.mjs');
    const { express_server } = require('../../src/server/server_conf.mjs');
    const { startWebSocket, broadcast } = require('../../src/server/server_ws.mjs');

    beforeEach(() => {
        jest.clearAllMocks();
        // Setup default mocks
        configFileExists.mockReturnValue(true);
        getConfigurationData.mockReturnValue({ scripts: [] });
        loadPlugins.mockReturnValue([]);
        executeAllScripts.mockResolvedValue([]);
        STATE.isWorking.mockReturnValue({
            setResults: jest.fn().mockReturnValue({
                updateCanCommit: jest.fn().mockReturnValue({ canCommit: true })
            })
        });
        STATE.updateCanCommit.mockResolvedValue({ canCommit: true });
    });

    it('should start the server successfully', async () => {
        await startGateKeeper();

        expect(expressLog).toHaveBeenCalledWith({
            message: 'HTTPS server started at https://localhost:9000',
            kind: 'HTTPS SERVER',
            severity: 'INFO'
        });
        expect(startWebSocket).toHaveBeenCalledWith(9001);
    });

    it('should execute scripts and broadcast results', async () => {
        const mockResults = [{ name: 'test', result: 'passed' }];
        executeAllScripts.mockResolvedValue(mockResults);

        await startGateKeeper();

        expect(executeAllScripts).toHaveBeenCalled();
        expect(broadcast).toHaveBeenCalledWith({
            type: 'STATUS_UPDATE',
            data: {
                canCommit: true,
                scripts: mockResults
            },
            success: true
        });
    });

    it('should handle script execution errors', async () => {
        const error = new Error('Script failed');
        executeAllScripts.mockRejectedValue(error);

        await startGateKeeper();

        expect(expressLog).toHaveBeenCalledWith({
            message: 'Unable to execute the scripts\n        Error: Script failed',
            kind: 'SCRIPTS',
            severity: 'ERROR'
        });
    });

    it('should handle configuration errors', async () => {
        loadPlugins.mockReturnValue({ error: true, data: 'Invalid config' });

        // Mock process.exit
        const mockExit = jest.spyOn(process, 'exit').mockImplementation(() => {});

        await startGateKeeper();

        expect(expressLog).toHaveBeenCalledWith({
            message: 'Configuration error: Invalid config',
            kind: 'CONFIG',
            severity: 'ERROR'
        });
        expect(mockExit).toHaveBeenCalledWith(1);

        mockExit.mockRestore();
    });
});
