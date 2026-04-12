import { vi } from 'vitest';

const readFileSyncMock = vi.hoisted(() => vi.fn().mockReturnValue(JSON.stringify({ version: '1.0.0' })));

// Mock process before importing anything
vi.stubGlobal('process', {
    ...global.process,
    argv: ['node', 'vitest'],
    exit: vi.fn()
});

import fs from 'fs';

const {
    startGateKeeper,
    toWindowsPath,
    isWSL,
    showHelp,
    showVersion
} = await import('../../src/server/index.mjs');

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
    express_app: {},
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

// Mock the terminal client
vi.mock('../../src/terminal/client-terminal.mjs', () => ({
    startTerminalClient: vi.fn().mockResolvedValue()
}));

// Mock fs for showVersion
vi.mock('fs', () => ({
    default: {
        readFileSync: readFileSyncMock
    },
    readFileSync: readFileSyncMock
}));

describe('Server Index', () => {
    let expressLog;
    let getConfigurationData;
    let loadPlugins;
    let configFileExists;
    let executeAllScripts;
    let STATE;
    let startWebSocket;
    let broadcast;

    beforeEach(async () => {
        vi.clearAllMocks();
        
        // Keep the entrypoint import side-effect free during tests.
        process.argv = ['node', 'vitest'];
        
        // Mock fs.readFileSync for showVersion
        vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify({ version: '1.0.0' }));
        
        // Import mocked modules
        const log = await import('../../src/libs/log.mjs');
        const loadConfig = await import('../../src/libs/load_config.mjs');
        const executeScripts = await import('../../src/libs/execute_scripts.mjs');
        const state = await import('../../src/libs/state.mjs');
        const serverWs = await import('../../src/server/server_ws.mjs');
        
        // Get mocked functions
        expressLog = vi.mocked(log.expressLog);
        getConfigurationData = vi.mocked(loadConfig.getConfigurationData);
        loadPlugins = vi.mocked(loadConfig.loadPlugins);
        configFileExists = vi.mocked(loadConfig.configFileExists);
        executeAllScripts = vi.mocked(executeScripts.executeAllScripts);
        STATE = state.STATE;
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

    it.skip('should output version info with showVersion', () => {

        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});

        showVersion();

        expect(consoleLogMock).toHaveBeenCalledWith('Gate Keeper v1.0.0');

        consoleLogMock.mockRestore();
    });

    it('should show help without throwing', () => {
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});

        showHelp();

        expect(consoleLogMock).toHaveBeenCalled();

        consoleLogMock.mockRestore();
    });

    it('should include client-terminal in help text', () => {
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => {});

        showHelp();

        expect(consoleLogMock).toHaveBeenCalledWith(
            expect.stringContaining('client-terminal  Open the terminal client')
        );

        consoleLogMock.mockRestore();
    });
});
