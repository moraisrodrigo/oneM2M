import http from 'http';
import { loadEnv } from './utils/env';
import { Service } from './services/index';
import { Controller } from './controllers';
import { ManagementController } from './controllers/management';
import { PORT, APP_URL } from './constants';
import { isManagementRelatedRequest } from './utils';

loadEnv();

class OneM2M {
    private service: Service;
    private server: http.Server;
    private controller: Controller;
    private managementController: ManagementController;

    constructor() {
        console.log("Device is starting...");
        const service = new Service();
        this.service = service;
        this.controller = new Controller(service);
        this.managementController = new ManagementController();
        this.server = http.createServer(this.requestListener.bind(this));
    }

    private requestListener(request: http.IncomingMessage, response: http.ServerResponse) {
        if (isManagementRelatedRequest(request)) return this.managementController.handleRequest(request, response, this.stop.bind(this));

        this.controller.handleRequest(request, response);
    }

    private restart() {
        this.service = new Service();
        this.controller = new Controller(this.service);
        this.managementController = new ManagementController();
        this.server = http.createServer(this.requestListener.bind(this));
        this.start();
    }

    private stop() {
        this.server.close(this.restart.bind(this));
    }

    start() {
        this.server.listen(PORT(), APP_URL(), () => {
            const addressConf = this.server.address();
            const address = typeof addressConf === 'string' ? addressConf : addressConf?.address ?? 'localhost';

            console.log(`Device running on http://${address}:${PORT()}`);
        });
    }
}

const oneM2M = new OneM2M();

oneM2M.start();
