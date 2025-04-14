import { IncomingMessage, ServerResponse } from 'http';
import { Service } from '../services/index';
import { CustomHeaders, CustomAttributes, ResourceType, ShortName } from '../types/index';
import { JSON_CONTENT_TYPE } from '../constants/index';
import {
    isApplicationEntityCreateRequest,
    isContainerCreateRequest,
    isContentInstanceCreateRequest,
} from '../utils/index';

export class Controller {
    constructor(private service: Service) { }

    handleRequest(req: IncomingMessage, res: ServerResponse): void {
        let body = '';

        req.on('data', chunk => { body += chunk.toString(); });

        req.on('end', () => {
            res.setHeader(CustomHeaders.ContentType, 'application/json');

            try {
                const origin = req.headers[CustomHeaders.Origin];

                if (!origin) {
                    res.writeHead(400);
                    return res.end(JSON.stringify({ error: `Missing mandatory '${CustomHeaders.Origin}' header` }));
                }

                if (isApplicationEntityCreateRequest(req)) return this.createAE(req, body, res);

                if (isContainerCreateRequest(req)) return this.createContainer(req, body, res);

                if (isContentInstanceCreateRequest(req)) return this.createContentInstance(req, body, res);

                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not Found' }));
            } catch (error: any) {
                res.writeHead(500);

                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }

    private createAE(req: IncomingMessage, body: string, res: ServerResponse) {
        const resourceId = req.headers[CustomHeaders.ResourceID];
        if (!resourceId) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: `Missing mandatory '${CustomHeaders.ResourceID}' header` }));
        }

        const { [ShortName.ResourceName]: resourceName } = JSON.parse(body);

        if (!resourceName) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: `Missing (${ShortName.ResourceName})` }));
        }

        const createdAE = this.service.createAE(resourceName, resourceId as string);

        if (!createdAE) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: 'Something went wrong while creating AE' }));
        }

        res.writeHead(201, {
            [CustomHeaders.ResourceID]: createdAE[ShortName.ResourceID],
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
        });

        return res.end(JSON.stringify({ [CustomAttributes.ApplicationEntity]: createdAE }));
    }

    private createContainer(req: IncomingMessage, body: string, res: ServerResponse) {
        const resourceId = req.headers[CustomHeaders.ResourceID];
        if (!resourceId) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: `Missing mandatory '${CustomHeaders.ResourceID}' header` }));
        }

        if (!req.url) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: 'Invalid URL' }));
        }

        const { [CustomAttributes.Container]: containerBody } = JSON.parse(body);
        if (!containerBody) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: `Missing (${CustomAttributes.Container})` }));
        }

        const { [ShortName.ResourceName]: resourceName } = containerBody;
        if (!resourceName) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: `Missing (${ShortName.ResourceName}) in (${CustomAttributes.Container})` }));
        }

        // '/onem2m/app_light'
        const parts = req.url.split('/');
        // parts = [ '', 'onem2m', 'app_light' ]
        // parts[2] = 'app_light' (eg: app_light is the application entity name)
        const createdContainer = this.service.createContainer(resourceName, resourceId as string, parts[2]);

        if (!createdContainer) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: 'Something went wrong while creating Container' }));
        }

        res.writeHead(201, {
            [CustomHeaders.ResourceID]: createdContainer[ShortName.ResourceID],
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.Container}`,
        });

        return res.end(JSON.stringify({ [CustomAttributes.Container]: createdContainer }));
    }

    private createContentInstance(req: IncomingMessage, body: string, res: ServerResponse) {
        const resourceId = req.headers[CustomHeaders.ResourceID];

        if (!resourceId) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: `Missing mandatory '${CustomHeaders.ResourceID}' header` }));
        }

        if (!req.url) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: 'Invalid URL' }));
        }

        const { [CustomAttributes.ContentInstance]: contentInstanceBody } = JSON.parse(body);
        if (!contentInstanceBody) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: `Missing (${CustomAttributes.ContentInstance})` }));
        }

        const {
            [ShortName.ResourceName]: resourceName,
            [ShortName.Content]: content,
        } = contentInstanceBody;

        if (!resourceName) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: `Missing (${ShortName.ResourceName}) in (${CustomAttributes.ContentInstance})` }));
        }

        if (!content) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: `Missing (${ShortName.Content}) in (${CustomAttributes.ContentInstance})` }));
        }

        // req.url = '/onem2m/app_light/status'
        const parts = req.url.split('/');
        // parts = [ '', 'onem2m', 'app_light', 'status' ]
        // parts[3] = 'status' (eg: status is the container name)
        const containerName = parts[3];
        // parts[2] = 'app_light' (eg: app_light is the application entity name)
        const applicationEntityName = parts[2];
        const createdContentInstance = this.service.createContentInstance(resourceName, resourceId as string, containerName, applicationEntityName, content);

        if (!createdContentInstance) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: 'Something went wrong while creating content Instance' }));
        }

        res.writeHead(201, {
            [CustomHeaders.ResourceID]: createdContentInstance[ShortName.ResourceID],
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ContentInstance}`,
        });

        return res.end(JSON.stringify({ [CustomAttributes.ContentInstance]: createdContentInstance }));
    }
}
