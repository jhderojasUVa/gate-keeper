import {
    CONFIGURATION_FILE,
    DEFAULT_CONFIGURATION_FILE,
    SCRIPT_MODEL,
    GATE_KEEPER_CONFIG_MODEL
} from '../../src/models/configuration.model.js';

describe('Configuration Model', () => {
    it('should have correct default configuration file names', () => {
        expect(CONFIGURATION_FILE).toBe('gate-keeper.conf.json');
        expect(DEFAULT_CONFIGURATION_FILE).toBe('default.gate-keeper.conf.json');
    });

    it('should have the correct SCRIPT_MODEL structure', () => {
        expect(SCRIPT_MODEL).toHaveProperty('name', undefined);
        expect(SCRIPT_MODEL).toHaveProperty('command', undefined);
        expect(SCRIPT_MODEL).toHaveProperty('data', undefined);
        expect(SCRIPT_MODEL).toHaveProperty('result', undefined);
    });

    it('should have the correct GATE_KEEPER_CONFIG_MODEL structure', () => {
        expect(GATE_KEEPER_CONFIG_MODEL).toHaveProperty('port', undefined);
        expect(GATE_KEEPER_CONFIG_MODEL).toHaveProperty('host', undefined);
        expect(Array.isArray(GATE_KEEPER_CONFIG_MODEL.scripts)).toBe(true);
        expect(GATE_KEEPER_CONFIG_MODEL.scripts[0]).toBe(SCRIPT_MODEL);
    });
});
