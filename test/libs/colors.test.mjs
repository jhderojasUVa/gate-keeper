import { colors, textStiles } from '../../src/libs/colors.ts';

describe('Colors', () => {
    it('should export colors object', () => {
        expect(colors).toBeDefined();
        expect(typeof colors).toBe('object');
    });

    it('should have reset color', () => {
        expect(colors.reset).toBe('\x1b[0m');
    });

    it('should have bright color', () => {
        expect(colors.bright).toBe('\x1b[1m');
    });

    it('should have dim color', () => {
        expect(colors.dim).toBe('\x1b[2m');
    });

    it('should have text colors', () => {
        expect(colors.text).toBeDefined();
        expect(colors.text.red).toBe('\x1b[31m');
        expect(colors.text.green).toBe('\x1b[32m');
        expect(colors.text.blue).toBe('\x1b[34m');
        expect(colors.text.yellow).toBe('\x1b[33m');
    });

    it('should have background colors', () => {
        expect(colors.background).toBeDefined();
        expect(colors.background.red).toBe('\x1b[41m');
        expect(colors.background.green).toBe('\x1b[42m');
        expect(colors.background.blue).toBe('\x1b[44m');
    });

    it('should export textStiles object', () => {
        expect(textStiles).toBeDefined();
        expect(typeof textStiles).toBe('object');
    });

    it('should have underline style', () => {
        expect(textStiles.underline).toBe('\x1b[4m');
    });

    it('should have blink style', () => {
        expect(textStiles.blink).toBe('\x1b[5m');
    });
});