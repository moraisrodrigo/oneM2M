import http from 'http';
import { Service } from './src/services';
import { Controller } from './src/controllers';

const service = new Service();

const controller = new Controller(service);

const server = http.createServer((req, res) => controller.handleRequest(req, res));

const PORT = 3000;

server.listen(PORT, () => {
    console.log(`oneM2M device running on http://localhost:${PORT}`);
});
