import request from 'supertest';
import { express_app, express_port, express_ws_port, isHTTPS } from '../../src/server/server_conf.mjs';

describe('Server Configuration', () => {
    it('should configure express_port and express_ws_port', () => {
        expect(express_port).toBeDefined();
        expect(express_ws_port).toBeDefined();
        expect(isHTTPS).toBeDefined();
    });

    it('GET /cancommit should return canCommit state', async () => {
        const response = await request(express_app).get('/cancommit');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('cancommit');
    });

    it('GET /ws-port should return configured ws port', async () => {
        const response = await request(express_app).get('/ws-port');
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('port');
    });
});
