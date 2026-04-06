import request from 'supertest';
import { express_app, express_port, express_ws_port, isHTTPS } from '../../src/server/server_conf.mjs';

describe('Server Configuration', () => {
    it('should configure express_port and express_ws_port', () => {
        expect(express_port).toBeDefined();
        expect(typeof express_port).toBe('number');
        expect(express_ws_port).toBeDefined();
        expect(typeof express_ws_port).toBe('number');
        expect(isHTTPS).toBeDefined();
        expect(typeof isHTTPS).toBe('boolean');
    });

    it('GET /cancommit should return canCommit state', async () => {
        const response = await request(express_app).get('/cancommit');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('cancommit');
        expect(typeof response.body.cancommit).toBe('boolean');
    });

    it('GET /ws-port should return configured ws port', async () => {
        const response = await request(express_app).get('/ws-port');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('port');
        expect(response.body.port).toBe(express_ws_port);
    });

    it('should serve static files from public directory', async () => {
        const response = await request(express_app).get('/index.html');
        expect(response.status).toBe(200);
        expect(response.type).toBe('text/html');
    });

    it('should serve CSS files', async () => {
        const response = await request(express_app).get('/css/styles.css');
        expect(response.status).toBe(200);
        expect(response.type).toBe('text/css');
    });

    it('should serve JavaScript files', async () => {
        const response = await request(express_app).get('/js/main.js');
        expect(response.status).toBe(200);
        expect(response.type).toBe('application/javascript');
    });

    it('should return 404 for non-existent files', async () => {
        const response = await request(express_app).get('/nonexistent.html');
        expect(response.status).toBe(404);
    });
});
