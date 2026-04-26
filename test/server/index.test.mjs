import { beforeEach, describe, expect, it, vi } from 'vitest';

const realProcess = globalThis.process;

const mocks = vi.hoisted(() => {
    const state = {
        setWorking: vi.fn(),
        setResults: vi.fn(),
        getStatus: vi.fn(),
        updateCanCommit: vi.fn(),
        canCommit: true,
        scripts: []
    };

    return {
        readFileSync: vi.fn(),
        exec: vi.fn(),
        expressLog: vi.fn(),
        getConfigurationData: vi.fn(),
        loadPlugins: vi.fn(),
        configFileExists: vi.fn(),
        executeAllScripts: vi.fn(),
        STATE: state,
        expressServerListen: vi.fn(),
        expressServerOn: vi.fn(),
        startWebSocket: vi.fn(),
        broadcast: vi.fn(),
        startMcpServer: vi.fn(),
        startTerminalClient: vi.fn()
    };
});

vi.mock('fs', () => ({
    default: {
        readFileSync: mocks.readFileSync
    },
    readFileSync: mocks.readFileSync
}));

vi.mock('child_process', () => ({
    exec: mocks.exec
}));

vi.mock('../../src/libs/log.ts', () => ({
    expressLog: mocks.expressLog
}));

vi.mock('../../src/libs/load_config.ts', () => ({
    getConfigurationData: mocks.getConfigurationData,
    loadPlugins: mocks.loadPlugins,
    configFileExists: mocks.configFileExists
}));

vi.mock('../../src/libs/execute_scripts.ts', () => ({
    executeAllScripts: mocks.executeAllScripts
}));

vi.mock('../../src/libs/state.ts', () => ({
    STATE: mocks.STATE
}));

vi.mock('../../src/server/server_conf.ts', () => ({
    express_app: {},
    express_server: {
        listen: mocks.expressServerListen,
        on: mocks.expressServerOn
    },
    express_port: 9000,
    express_ws_port: 9001,
    isHTTPS: true
}));

vi.mock('../../src/server/server_ws.ts', () => ({
    startWebSocket: mocks.startWebSocket,
    broadcast: mocks.broadcast
}));

vi.mock('../../src/server/mcp_server.ts', () => ({
    startMcpServer: mocks.startMcpServer,
    mcp_port: 9002
}));

vi.mock('../../src/terminal/client-terminal.ts', () => ({
    startTerminalClient: mocks.startTerminalClient
}));

const setProcess = ({ argv = ['node', 'vitest'], platform = 'linux', env = {} } = {}) => {
    vi.stubGlobal('process', {
        ...realProcess,
        argv,
        platform,
        env: {
            ...realProcess.env,
            ...env
        },
        exit: vi.fn()
    });
};

const loadServerIndex = async () => {
    return import('../../src/server/index.ts');
};

describe('Server Index', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.resetModules();
        vi.doMock('../../src/server/server_conf.ts', () => ({
            express_app: {},
            express_server: {
                listen: mocks.expressServerListen,
                on: mocks.expressServerOn
            },
            express_port: 9000,
            express_ws_port: 9001,
            isHTTPS: true
        }));

        setProcess();

        mocks.readFileSync.mockImplementation((path) => {
            if (path === '/proc/version') {
                return 'linux version';
            }

            return JSON.stringify({ version: '1.2.0-beta.0' });
        });
        mocks.exec.mockImplementation((command, callback) => callback?.(null));
        mocks.expressServerListen.mockImplementation((port, callback) => callback());
        mocks.expressServerOn.mockImplementation(() => undefined);
        mocks.startMcpServer.mockResolvedValue({ close: vi.fn() });
        mocks.getConfigurationData.mockReturnValue({ scripts: [] });
        mocks.loadPlugins.mockReturnValue([]);
        mocks.configFileExists.mockReturnValue(true);
        mocks.executeAllScripts.mockResolvedValue([]);
        mocks.STATE.setWorking.mockReturnValue(mocks.STATE);
        mocks.STATE.setResults.mockReturnValue(mocks.STATE);
        mocks.STATE.updateCanCommit.mockResolvedValue({ canCommit: true });
        mocks.STATE.getStatus.mockReturnValue({
            canCommit: true,
            inProgress: false,
            scripts: []
        });
        mocks.startTerminalClient.mockResolvedValue(undefined);
    });

    it('should start the server successfully', async () => {
        const { startGateKeeper } = await loadServerIndex();

        await startGateKeeper();

        expect(mocks.expressLog).toHaveBeenCalledWith({
            message: 'HTTPS server started at https://localhost:9000',
            kind: 'HTTPS SERVER',
            severity: 'INFO'
        });
        expect(mocks.startMcpServer).toHaveBeenCalled();
        expect(mocks.startWebSocket).toHaveBeenCalledWith(9001);
    });

    it('should log the beta startup ribbon for beta builds', async () => {
        const { startGateKeeper } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await startGateKeeper();

        expect(consoleLogMock).toHaveBeenCalledWith('🧪 ==================================================');
        expect(consoleLogMock).toHaveBeenCalledWith('🧪 Gate Keeper BETA build detected (v1.2.0-beta.0)');

        consoleLogMock.mockRestore();
    });

    it('should execute scripts and broadcast results', async () => {
        const { startGateKeeper } = await loadServerIndex();
        const mockResults = [{ name: 'test', result: 'passed' }];
        mocks.executeAllScripts.mockResolvedValue(mockResults);
        mocks.STATE.getStatus.mockReturnValue({
            canCommit: true,
            inProgress: false,
            scripts: mockResults
        });

        await startGateKeeper();

        expect(mocks.executeAllScripts).toHaveBeenCalled();
        expect(mocks.broadcast).toHaveBeenCalledWith({
            type: 'STATUS_UPDATE',
            data: {
                canCommit: true,
                inProgress: false,
                scripts: mockResults
            },
            success: true
        });
    });

    it('should log when initial checks cannot commit', async () => {
        const { startGateKeeper } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        mocks.STATE.updateCanCommit.mockResolvedValue({ canCommit: false });

        await startGateKeeper();

        expect(consoleLogMock).toHaveBeenCalledWith('   Can commit: ❌ No');
        expect(consoleLogMock).toHaveBeenCalledWith('   Some checks failed. Check the web interface for details.');

        consoleLogMock.mockRestore();
    });

    it('should handle script execution errors', async () => {
        const { startGateKeeper } = await loadServerIndex();
        const error = new Error('Script failed');
        mocks.executeAllScripts.mockRejectedValue(error);

        await startGateKeeper();

        expect(mocks.expressLog).toHaveBeenCalledWith({
            message: 'Unable to execute the scripts\n        Error: Script failed',
            kind: 'SCRIPTS',
            severity: 'ERROR'
        });
    });

    it('should handle configuration errors', async () => {
        const { startGateKeeper } = await loadServerIndex();
        mocks.loadPlugins.mockReturnValue({ error: true, data: 'Invalid config' });

        await startGateKeeper();

        expect(process.exit).toHaveBeenCalledWith(1);
    });

    it('should exit if config file does not exist', async () => {
        const { startGateKeeper } = await loadServerIndex();
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        mocks.configFileExists.mockReturnValue(false);

        await startGateKeeper();

        expect(consoleLogSpy).toHaveBeenCalledWith('⚠️  Warning: Configuration file not found. Using defaults.');

        consoleLogSpy.mockRestore();
    });

    it('should handle server listen errors', async () => {
        const { startGateKeeper } = await loadServerIndex();
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        mocks.expressServerListen.mockImplementation(() => undefined);
        mocks.expressServerOn.mockImplementation((event, handler) => {
            if (event === 'error') {
                handler(new Error('Port already in use'));
            }
        });

        await startGateKeeper();

        expect(consoleLogSpy).toHaveBeenCalledWith('❌ Failed to start server: Port already in use');
        expect(consoleLogSpy).toHaveBeenCalledWith('💥 Failed to start Gate Keeper: Port already in use');
        expect(process.exit).toHaveBeenCalledWith(1);

        consoleLogSpy.mockRestore();
    });

    it('should handle dependency loading failures', async () => {
        vi.doMock('../../src/server/server_conf.ts', () => {
            const brokenModule = {
                express_app: {},
                express_ws_port: 9001,
                isHTTPS: true
            };

            Object.defineProperty(brokenModule, 'express_server', {
                enumerable: true,
                get() {
                    throw new Error('Broken server configuration import');
                }
            });

            Object.defineProperty(brokenModule, 'express_port', {
                enumerable: true,
                value: 9000
            });

            return brokenModule;
        });

        const { startGateKeeper } = await loadServerIndex();
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await startGateKeeper();

        expect(consoleLogSpy).toHaveBeenCalledWith('❌ Error loading dependencies: Broken server configuration import');
        expect(process.exit).toHaveBeenCalledWith(1);

        consoleLogSpy.mockRestore();
    });

    it('should handle outer fatal startup errors', async () => {
        const { startGateKeeper } = await loadServerIndex();
        const consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        mocks.startMcpServer.mockRejectedValue(new Error('MCP startup failed'));

        await startGateKeeper();

        expect(consoleLogSpy).toHaveBeenCalledWith('💥 Failed to start Gate Keeper: MCP startup failed');
        expect(process.exit).toHaveBeenCalledWith(1);

        consoleLogSpy.mockRestore();
    });

    it('should convert WSL paths to Windows paths', async () => {
        const { toWindowsPath } = await loadServerIndex();

        expect(toWindowsPath('/mnt/c/Users/test')).toBe('C:\\Users\\test');
        expect(toWindowsPath('/mnt/')).toBe('/mnt/');
        expect(toWindowsPath('/home/test')).toBe('/home/test');
    });

    it('should detect WSL from /proc/version', async () => {
        const { isWSL } = await loadServerIndex();
        mocks.readFileSync.mockImplementation((path) => {
            if (path === '/proc/version') {
                return 'Linux version 5.15 Microsoft';
            }

            return JSON.stringify({ version: '1.2.0-beta.0' });
        });

        expect(isWSL()).toBe(true);
    });

    it('should return false when WSL detection cannot read /proc/version', async () => {
        const { isWSL } = await loadServerIndex();
        mocks.readFileSync.mockImplementation((path) => {
            if (path === '/proc/version') {
                throw new Error('Cannot read proc version');
            }

            return JSON.stringify({ version: '1.2.0-beta.0' });
        });

        expect(isWSL()).toBe(false);
    });

    it('should output version info with showVersion', async () => {
        const { showVersion } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        showVersion();

        expect(consoleLogMock).toHaveBeenCalledWith('Gate Keeper v1.2.0-beta.0');

        consoleLogMock.mockRestore();
    });

    it('should show help without throwing', async () => {
        const { showHelp } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        showHelp();

        expect(consoleLogMock).toHaveBeenCalled();

        consoleLogMock.mockRestore();
    });

    it('should include client-terminal in help text', async () => {
        const { showHelp } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        showHelp();

        expect(consoleLogMock).toHaveBeenCalledWith(
            expect.stringContaining('client-terminal  Open the terminal client')
        );

        consoleLogMock.mockRestore();
    });

    it.each([
        ['darwin', {}, 'open "https://localhost:9000"'],
        ['win32', {}, 'start "https://localhost:9000"'],
        ['linux', {}, 'xdg-open "https://localhost:9000"'],
        ['linux', { GATE_KEEPER_PORT: '8080', GATE_KEEPER_HTTPS: 'false' }, 'xdg-open "http://localhost:8080"']
    ])('should open the graphical client on %s', async (platform, env, expectedCommand) => {
        setProcess({ platform, env });
        const { openClient } = await loadServerIndex();

        await openClient();

        expect(mocks.exec).toHaveBeenCalledWith(expectedCommand, expect.any(Function));
    });

    it('should use powershell when opening the client from WSL', async () => {
        setProcess({ platform: 'linux' });
        mocks.readFileSync.mockImplementation((path) => {
            if (path === '/proc/version') {
                return 'Linux version 5.15 microsoft-standard-WSL2';
            }

            return JSON.stringify({ version: '1.2.0-beta.0' });
        });
        const { openClient } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await openClient();

        expect(consoleLogMock).toHaveBeenCalledWith('   (Running in WSL, opening host browser...)');
        expect(mocks.exec).toHaveBeenCalledWith(
            'powershell.exe -Command "Start-Process \'https://localhost:9000\'"',
            expect.any(Function)
        );

        consoleLogMock.mockRestore();
    });

    it('should handle browser open callback failures', async () => {
        const { openClient } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        mocks.exec.mockImplementation((command, callback) => callback(new Error('No browser found')));

        await openClient();

        expect(consoleLogMock).toHaveBeenCalledWith('❌ Failed to open browser: No browser found');
        expect(process.exit).toHaveBeenCalledWith(1);

        consoleLogMock.mockRestore();
    });

    it('should handle synchronous browser open errors', async () => {
        const { openClient } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        mocks.exec.mockImplementation(() => {
            throw new Error('exec exploded');
        });

        await openClient();

        expect(consoleLogMock).toHaveBeenCalledWith('❌ Error opening graphical client: exec exploded');
        expect(process.exit).toHaveBeenCalledWith(1);

        consoleLogMock.mockRestore();
    });

    it('should exit for missing CLI commands', async () => {
        const { handleCli } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await handleCli([]);

        expect(consoleLogMock).toHaveBeenCalledWith('❌ Missing required command');
        expect(process.exit).toHaveBeenCalledWith(1);

        consoleLogMock.mockRestore();
    });

    it('should exit after showing the CLI version', async () => {
        const { handleCli } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await handleCli(['--version']);

        expect(consoleLogMock).toHaveBeenCalledWith('Gate Keeper v1.2.0-beta.0');
        expect(process.exit).toHaveBeenCalledWith(0);

        consoleLogMock.mockRestore();
    });

    it('should exit for unknown CLI commands', async () => {
        const { handleCli } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await handleCli(['mystery']);

        expect(consoleLogMock).toHaveBeenCalledWith('❌ Unknown command: mystery');
        expect(process.exit).toHaveBeenCalledWith(1);

        consoleLogMock.mockRestore();
    });

    it('should exit for unknown CLI arguments', async () => {
        const { handleCli } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await handleCli(['server', '--bogus']);

        expect(consoleLogMock).toHaveBeenCalledWith('❌ Unknown argument(s): --bogus');
        expect(process.exit).toHaveBeenCalledWith(1);

        consoleLogMock.mockRestore();
    });

    it('should ignore --open in client mode and open the client', async () => {
        const { handleCli } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await handleCli(['client', '--open']);

        expect(consoleLogMock).toHaveBeenCalledWith('⚠️  --open flag ignored in client mode');
        expect(mocks.exec).toHaveBeenCalledWith('xdg-open "https://localhost:9000"', expect.any(Function));

        consoleLogMock.mockRestore();
    });

    it('should ignore --open in client-terminal mode', async () => {
        const { handleCli } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await handleCli(['client-terminal', '--open']);

        expect(consoleLogMock).toHaveBeenCalledWith('⚠️  --open flag ignored in client-terminal mode');
        expect(mocks.startTerminalClient).toHaveBeenCalled();

        consoleLogMock.mockRestore();
    });

    it('should exit when the terminal client fails to start', async () => {
        const { handleCli } = await loadServerIndex();
        const consoleErrorMock = vi.spyOn(console, 'error').mockImplementation(() => undefined);
        mocks.startTerminalClient.mockRejectedValue(new Error('Terminal start failed'));

        await handleCli(['client-terminal']);

        expect(consoleErrorMock).toHaveBeenCalledWith(
            'Failed to start terminal client:',
            expect.objectContaining({ message: 'Terminal start failed' })
        );
        expect(process.exit).toHaveBeenCalledWith(1);

        consoleErrorMock.mockRestore();
    });

    it('should start the server from the CLI and open the browser', async () => {
        setProcess({ platform: 'win32' });
        const { handleCli } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await handleCli(['server', '--open']);

        expect(mocks.startMcpServer).toHaveBeenCalled();
        expect(consoleLogMock).toHaveBeenCalledWith('🌐 Opening browser to https://localhost:9000...');
        expect(mocks.exec).toHaveBeenCalledWith('start "https://localhost:9000"', expect.any(Function));

        consoleLogMock.mockRestore();
    });

    it('should open the server browser from the CLI on darwin', async () => {
        setProcess({ platform: 'darwin' });
        const { handleCli } = await loadServerIndex();

        await handleCli(['server', '--open']);

        expect(mocks.exec).toHaveBeenCalledWith('open "https://localhost:9000"', expect.any(Function));
    });

    it('should use HTTP URLs when HTTPS is disabled for server startup and browser opening', async () => {
        vi.doMock('../../src/server/server_conf.ts', () => ({
            express_app: {},
            express_server: {
                listen: mocks.expressServerListen,
                on: mocks.expressServerOn
            },
            express_port: 9000,
            express_ws_port: 9001,
            isHTTPS: false
        }));
        const { handleCli } = await loadServerIndex();

        await handleCli(['server', '--open']);

        expect(mocks.expressLog).toHaveBeenCalledWith({
            message: 'HTTP server started at http://localhost:9000',
            kind: 'HTTP SERVER',
            severity: 'INFO'
        });
        expect(mocks.exec).toHaveBeenCalledWith('xdg-open "http://localhost:9000"', expect.any(Function));
    });

    it('should use powershell when opening the server browser from WSL', async () => {
        setProcess({ platform: 'linux' });
        mocks.readFileSync.mockImplementation((path) => {
            if (path === '/proc/version') {
                return 'Linux version microsoft-standard-WSL2';
            }

            return JSON.stringify({ version: '1.2.0-beta.0' });
        });
        const { handleCli } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await handleCli(['server', '--open']);

        expect(consoleLogMock).toHaveBeenCalledWith('   (Running in WSL, opening host browser...)');
        expect(mocks.exec).toHaveBeenCalledWith(
            'powershell.exe -Command "Start-Process \'https://localhost:9000\'"',
            expect.any(Function)
        );

        consoleLogMock.mockRestore();
    });

    it('should log server browser open callback failures', async () => {
        const { handleCli } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        mocks.exec.mockImplementation((command, callback) => callback(new Error('Browser callback failed')));

        await handleCli(['server', '--open']);

        expect(consoleLogMock).toHaveBeenCalledWith('Failed to open browser: Browser callback failed');

        consoleLogMock.mockRestore();
    });

    it('should handle fatal CLI server errors', async () => {
        const { handleCli } = await loadServerIndex();
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);
        mocks.exec.mockImplementation(() => {
            throw new Error('Browser exec failed');
        });

        await handleCli(['server', '--open']);

        expect(consoleLogMock).toHaveBeenCalledWith('❌ Fatal error: Browser exec failed');
        expect(process.exit).toHaveBeenCalledWith(1);

        consoleLogMock.mockRestore();
    });

    it('should execute the main-module CLI path on import', async () => {
        setProcess({ argv: ['node', 'gate-keeper', '--help'] });
        const consoleLogMock = vi.spyOn(console, 'log').mockImplementation(() => undefined);

        await loadServerIndex();

        expect(consoleLogMock).toHaveBeenCalled();
        expect(process.exit).toHaveBeenCalledWith(0);

        consoleLogMock.mockRestore();
    });
});
