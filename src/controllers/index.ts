import { IncomingMessage, ServerResponse } from 'http';
import { Service } from '../services/index';
import { CustomHeaders, CustomAttributes, ResourceType, ShortName, StatusCode, HTTPStatusCodeMapping } from '../types/index';
import { CSE_NAME, JSON_CONTENT_TYPE } from '../constants/index';
import {
    isApplicationEntityCreateRequest,
    isApplicationEntityGetRequest,
    isContainerCreateRequest,
    isContentInstanceCreateRequest,
    isCreationRequest,
    isRetrievalRequest,
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

                if (isCreationRequest(req)) return this.creationRequest(req, body, res);

                if (isRetrievalRequest(req)) return this.retrievalRequest(req, res);

                res.writeHead(404);
                res.end(JSON.stringify({ error: 'Not Found' }));
            } catch (error: any) {
                res.writeHead(500);

                res.end(JSON.stringify({ error: error.message }));
            }
        });
    }

    private creationRequest(req: IncomingMessage, body: string, res: ServerResponse) {
        if (isApplicationEntityCreateRequest(req)) return this.createAE(req, body, res);

        if (isContainerCreateRequest(req)) return this.createContainer(req, body, res);

        if (isContentInstanceCreateRequest(req)) return this.createContentInstance(req, body, res);

        return this.notImplemented(req, res);
    }

    private retrievalRequest(req: IncomingMessage, res: ServerResponse) {
        if (isApplicationEntityGetRequest(req)) return this.getAEs(req, res);

        if (isContainerCreateRequest(req)) return this.getContainers(req, res);

        return this.notImplemented(req, res);
    }

    private notImplemented(req: IncomingMessage, res: ServerResponse) {
        const statusCode = StatusCode.NOT_IMPLEMENTED;
        res.writeHead(HTTPStatusCodeMapping[statusCode], {
            [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
            [CustomHeaders.StatusCode]: statusCode,
        });
        res.end();
    }

    private getAEs(req: IncomingMessage, res: ServerResponse) {
        const origin = req.headers[CustomHeaders.Origin];
        if (!origin) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: `Missing mandatory '${CustomHeaders.Origin}' header` }));
        }

        if (!req.url || !req.headers.host) {
            res.writeHead(400);
            return res.end(JSON.stringify({ error: 'Invalid URL' }));
        }

        // 2) Parse da URL e dos query-params
        const url = new URL(req.url, `http://${req.headers.host}`);
        const fu = url.searchParams.has('fu') ? Number(url.searchParams.get('fu')) : 2;  // default full
        const rty = url.searchParams.has('rty') ? Number(url.searchParams.get('rty')) : ResourceType.ApplicationEntity;

        // 3) Se pedirem outro tipo de recurso, devolve vazio
        if (rty !== ResourceType.ApplicationEntity) {
            res.writeHead(HTTPStatusCodeMapping[StatusCode.OK], {
                [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
                [CustomHeaders.StatusCode]: StatusCode.OK,
            });
            // só uris ou só array vazio
            if (fu === 1) {
                return res.end(JSON.stringify({ [CustomAttributes.UriPath]: [] }));
            } else {
                return res.end(JSON.stringify({ [CustomAttributes.ApplicationEntity]: [] }));
            }
        }

        // 4) Busca todos os AEs
        const aes = this.service.getAEs();

        // 5) Monta o payload conforme fu
        let payload: any;
        if (fu === 1) {
            // só URIs
            const uris = aes.map(ae => `/${CSE_NAME()}/${ae[ShortName.ResourceName]}`);

            payload = { [CustomAttributes.UriPath]: uris };
        } else {
            // recursos completos
            payload = { [CustomAttributes.ApplicationEntity]: aes };
        }

        // 6) Devolve 200 OK
        res.writeHead(HTTPStatusCodeMapping[StatusCode.OK], {
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
            [CustomHeaders.StatusCode]: StatusCode.OK,
        });
        return res.end(JSON.stringify(payload));
    }
    private getContainers(req: IncomingMessage, res: ServerResponse) {
        return this.notImplemented(req, res);
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
