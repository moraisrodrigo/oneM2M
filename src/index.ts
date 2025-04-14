import http from 'http';
import { loadEnv } from './utils/env';
import { Service } from './services/index';
import { Controller } from './controllers/index';
import { PORT } from './constants';

loadEnv();

const controller = new Controller(new Service());

const server = http.createServer((req, res) => controller.handleRequest(req, res));

server.listen(PORT, () => console.log(`oneM2M device running on http://localhost:${PORT}`));
