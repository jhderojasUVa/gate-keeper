import { startGateKeeper, toWindowsPath, isWSL, showHelp, showVersion } from '../../src/server/index.mjs';
import { vi } from 'vitest';

// Mock all dependencies
vi.mock('../../src/libs/log.mjs', () => ({
    expressLog: vi.fn()
}));

vi.mock('../../src/libs/load_config.mjs', () => ({
    getConfigurationData: vi.fn(),
    loadPlugins: vi.fn(),
    configFileExists: vi.fn()
}));

vi.mock('../../src/libs/execute_scripts.mjs', () => ({
    executeAllScripts: vi.fn()
}));

vi.mock('../../src/libs/state.mjs', () => ({
    STATE: {
        isWorking: vi.fn(),
        updateCanCommit: vi.fn(),
        canCommit: true,
        scripts: []
    }
}));

vi.mock('../../src/server/server_conf.mjs', () => ({
    express_server: {
        listen: vi.fn((port, callback) => callback()),
        on: vi.fn()
    },
    express_port: 9000,
    express_ws_port: 9001,
    isHTTPS: true
}));

vi.mock('../../src/server/server_ws.mjs', () => ({
    startWebSocket: vi.fn(),
    broadcast: vi.fn()
}));

describe('Server Index', () => {
    let expressLog;
    let getConfigurationData;
    let loadPlugins;
    let configFileExists;
    let executeAllScripts;
    let STATE;
    let express_server;
    let startWebSocket;
    let broadcast;

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Import mocked modules
        const log = await import('../../src/libs/log.mjs');
        const loadConfig = await import('../../src/libs/load_config.mjs');
        const executeScripts = await import('../../src/libs/execute_scripts.mjs');
        const state = await import('../../src/libs/state.mjs');
        const serverConf = await import('../../src/server/server_conf.mjs');
        const serverWs = await import('../../src/server/server_ws.mjs');
        
        // Get mocked functions
        expressLog = vi.mocked(log.expressLog);
        getConfigurationData = vi.mocked(loadConfig.getConfigurationData);
        loadPlugins = vi.mocked(loadConfig.loadPlugins);
        configFileExists = vi.mocked(loadConfig.configFileExists);
        executeAllScripts = vi.mocked(executeScripts.executeAllScripts);
        STATE = state.STATE;
        express_server = serverConf.express_server;
        startWebSocket = vi.mocked(serverWs.startWebSocket);
        broadcast = vi.mocked(serverWs.broadcast);
        
        // Setup default mocks
        configFileExists.mockReturnValue(true);
        getConfigurationData.mockReturnValue({ scripts: [] });
        loadPlugins.mockReturnValue([]);
        executeAllScripts.mockResolvedValue([]);
        STATE.isWorking.mockReturnValue({
            setResults: vi.fn().mockReturnValue({
                updateCanCommit: vi.fn().mockReturnValue({ canCommit: true })
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

        // Mock process.exit to avoid actually exiting
        const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => undefined);

        await startGateKeeper();

        // The exitWithCode function uses setImmediate, so we need to wait for timers
        await new Promise(resolve => setImmediate(resolve));

        // Verify that process.exit was called with code 1
        expect(mockExit).toHaveBeenCalledWith(1);

        mockExit.mockRestore();
    });

    it('should exit if config file does not exist', async () => {
        configFileExists.mockReturnValue(false);
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await startGateKeeper();

        expect(consoleLogSpy).toHaveBeenCalledWith('⚠️  Warning: Configuration file not found. Using defaults.');
        consoleLogSpy.mockRestore();
    });

    it('should convert WSL path to Windows path', () => {
        expect(toWindowsPath('/mnt/c/Users/test')).toBe('C:\\Users\\test');
        expect(toWindowsPath('/home/test')).toBe('/home/test');
    });

    it('should rate the WSL check as boolean', () => {
        expect(typeof isWSL()).toBe('boolean');
    });

    it('should output version info with showVersion', () => {
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});

        showVersion();

        expect(consoleLogMock).toHaveBeenCalled();

        consoleLogMock.mockRestore();
    });

    it('should show help without throwing', () => {
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});

        showHelp();

        expect(consoleLogMock).toHaveBeenCalled();

        consoleLogMock.mockRestore();
    });
});
