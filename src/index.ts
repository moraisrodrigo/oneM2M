import http from 'http';
import { Service } from './services/index.js';
import { Controller } from './controllers/index.js';

const controller = new Controller(new Service());

const server = http.createServer((req, res) => controller.handleRequest(req, res));

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`oneM2M device running on http://localhost:${PORT}`);
});
