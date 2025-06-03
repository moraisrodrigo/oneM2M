import { IncomingMessage, ServerResponse } from 'http';
import { Service } from '../services/index';
import { CustomHeaders, CustomAttributes, ResourceType, ShortName, StatusCode, HTTPStatusCodeMapping } from '../types/index';
import { CSE_NAME, JSON_CONTENT_TYPE } from '../constants/index';
import {
    isApplicationEntityCreateRequest,
    isContainerCreateRequest,
    isContentInstanceCreateRequest,
    isCreationRequest,
    isDiscoveryRequest,
    isApplicationEntityRetrieveRequest,
} from '../utils/index';
import { ContentInstanceModel } from '../models';

export class Controller {
    constructor(private service: Service) { }

    handleRequest(req: IncomingMessage, res: ServerResponse): void {
        let body = '';

        req.on('data', (chunk) => { body += chunk.toString(); });

        req.on('end', () => {
            res.setHeader(CustomHeaders.ContentType, 'application/json');

            try {
                const origin = req.headers[CustomHeaders.Origin];

                if (!origin) {
                    const statusCode = StatusCode.BAD_REQUEST;
                    res.writeHead(HTTPStatusCodeMapping[statusCode], {
                        [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                        [CustomHeaders.StatusCode]: statusCode,
                    });
                    return res.end(JSON.stringify({ error: `Missing mandatory '${CustomHeaders.Origin}' header` }));
                }

                if (isCreationRequest(req)) return this.creationRequest(req, body, res);

                if (isDiscoveryRequest(req)) return this.discoveryRequest(req, res);

                if (isApplicationEntityRetrieveRequest(req)) return this.retrieveAE(req, res);

                const statusCode = StatusCode.NOT_FOUND;
                res.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                res.end(JSON.stringify({ error: 'Not Found' }));
            } catch (error: any) {
                const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
                res.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                res.end(JSON.stringify({ error: error?.message || 'Internal Server Error' }));
            }
        });
    }

    private creationRequest(req: IncomingMessage, body: string, res: ServerResponse) {
        if (isApplicationEntityCreateRequest(req)) return this.createAE(req, body, res);

        if (isContainerCreateRequest(req)) return this.createContainer(req, body, res);

        if (isContentInstanceCreateRequest(req)) return this.createContentInstance(req, body, res);

        return this.notImplemented(req, res);
    }

    private discoveryRequest(req: IncomingMessage, res: ServerResponse) {
        if (req.url !== undefined) {
            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

            if (parsedUrl !== null) {
                const fu = parseInt(parsedUrl.searchParams.get(ShortName.FilterUsage) ?? "");
                const ty = parseInt(parsedUrl.searchParams.get(ShortName.Type) ?? "");

                switch (ty) {
                    case ResourceType.ApplicationEntity:
                        return this.getAEs(req, res, fu);
                    case ResourceType.Container:
                        return this.getContainers(req, res, fu);
                    case ResourceType.ContentInstance:
                        return this.getContentInstances(req, res, fu);
                    default:
                        return this.notImplemented(req, res);
                }
            }
        }
    }

    private notImplemented(req: IncomingMessage, res: ServerResponse) {
        const statusCode = StatusCode.NOT_IMPLEMENTED;
        res.writeHead(HTTPStatusCodeMapping[statusCode], {
            [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
            [CustomHeaders.StatusCode]: statusCode,
        });
        res.end();
    }

    private getAEs(req: IncomingMessage, res: ServerResponse, fu: Number) {
        // 4) Busca todos os AEs
        const aes = this.service.getAEs();
        // 5) Monta o payload conforme fu
        let payload: any;

        if (fu === 1) {
            // só URIs
            const uris = aes.map((applicationEntity) => `/${CSE_NAME()}/${applicationEntity[ShortName.ResourceName]}`);

            payload = { [CustomAttributes.UriPath]: uris };
        } else {
            // recursos completos
            payload = { [CustomAttributes.ApplicationEntity]: aes };
        }

        // 6) Devolve 200 OK
        const statusCode = StatusCode.OK;
        res.writeHead(HTTPStatusCodeMapping[statusCode], {
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
            [CustomHeaders.StatusCode]: statusCode,
        });

        return res.end(JSON.stringify(payload));
    }

    private getContainers(req: IncomingMessage, res: ServerResponse, fu: Number) {
        // 4) Busca todos os containers
        const containers = this.service.getContainers();
        // 5) Monta o payload conforme fu
        let payload: any;

        if (fu === 1) {
            // só URIs
            const uris = containers.map((container) => {
                let ae = this.service.getAEByResourceId(container[ShortName.ParentId]);
                if (ae !== undefined) return `/${CSE_NAME()}/${ae[ShortName.ResourceName]}/${container[ShortName.ResourceName]}`;
            });

            payload = { [CustomAttributes.UriPath]: uris };
        } else {
            // recursos completos
            payload = { [CustomAttributes.Container]: containers };
        }

        // 6) Devolve 200 OK
        const statusCode = StatusCode.OK;
        res.writeHead(HTTPStatusCodeMapping[statusCode], {
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.Container}`,
            [CustomHeaders.StatusCode]: statusCode,
        });

        return res.end(JSON.stringify(payload));
    }

    private getContentInstances(req: IncomingMessage, res: ServerResponse, fu: Number) {
        // 4) Busca todos os contentInstances
        const contentInstances = this.service.getContentInstances();
        // 5) Monta o payload conforme fu
        let payload: any;

        if (fu === 1) {
            // só URIs
            const uris = contentInstances.map((contentInstance) => {
                let container = this.service.getContainerByResourceId(contentInstance[ShortName.ParentId]);

                if (container !== undefined) {
                    let ae = this.service.getAEByResourceId(container[ShortName.ParentId]);
                    if (ae !== undefined) return `/${CSE_NAME()}/${ae[ShortName.ResourceName]}/${container[ShortName.ResourceName]}/${contentInstance[ShortName.ResourceName]}`;
                }

            });

            payload = { [CustomAttributes.UriPath]: uris };
        } else {
            // recursos completos
            payload = { [CustomAttributes.ContentInstance]: contentInstances };
        }

        // 6) Devolve 200 OK
        const statusCode = StatusCode.OK;
        res.writeHead(HTTPStatusCodeMapping[statusCode], {
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ContentInstance}`,
            [CustomHeaders.StatusCode]: statusCode,
        });

        return res.end(JSON.stringify(payload));
    }

    private createAE(req: IncomingMessage, body: string, res: ServerResponse) {
        const resourceId = req.headers[CustomHeaders.ResourceID];
        if (!resourceId) {
            const statusCode = StatusCode.BAD_REQUEST;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: `Missing mandatory '${CustomHeaders.ResourceID}' header` }));
        }

        const { [ShortName.ResourceName]: resourceName } = JSON.parse(body);

        if (!resourceName) {
            const statusCode = StatusCode.BAD_REQUEST;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: `Missing (${ShortName.ResourceName})` }));
        }

        const createdAE = this.service.createAE(resourceName, resourceId as string);

        if (!createdAE) {
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: 'Something went wrong while creating AE' }));
        }

        res.writeHead(201, {
            [CustomHeaders.ResourceID]: createdAE[ShortName.ResourceID],
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
        });

        return res.end(JSON.stringify({ [CustomAttributes.ApplicationEntity]: createdAE }));
    }

    private retrieveAE(req: IncomingMessage, res: ServerResponse) {
        if (req.url) {
            const baseUrl = `http://${req.headers.host}`;
            const url = new URL(req.url, baseUrl);

            let pathname = url.pathname;

            if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

            const segments = pathname.split('/').filter(Boolean);
            const rn = segments[1];
            const rcn = parseInt(url.searchParams.get(ShortName.ResultContent) ?? "");

            // Busca a AE pelo resourceName
            let ae = this.service.getAE(rn);
            if (ae === undefined) {
                const statusCode = StatusCode.NOT_FOUND;
                res.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return res.end(JSON.stringify({ error: 'Not Found' }));
            }

            let payload = null;

            if (rcn === 4) {
                // get child resources
                let containers = this.service.getContainersByParentId(ae[ShortName.ResourceID]);

                if (containers.length > 0) {
                    let contentInstances: ContentInstanceModel[] = [];

                    containers.forEach(container => {
                        contentInstances.push(...this.service.getContentInstancesByParentId(container[ShortName.ResourceID]));
                    });

                    if (containers.length > 0) {
                        payload = {
                            [CustomAttributes.ApplicationEntity]: ae,
                            [CustomAttributes.Container]: containers,
                            [CustomAttributes.ContentInstance]: contentInstances,
                        };
                    } else {
                        payload = {
                            [CustomAttributes.ApplicationEntity]: ae,
                            [CustomAttributes.Container]: containers,
                        };

                    }
                }
            } else {
                payload = { [CustomAttributes.ApplicationEntity]: ae };
            }


            // 6) Devolve 200 OK
            const statusCode = StatusCode.OK;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
                [CustomHeaders.StatusCode]: statusCode,
            });

            return res.end(JSON.stringify(payload));
        } else {
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: 'Something went wrong while retrieving the AE' }));
        }
    }

    private createContainer(req: IncomingMessage, body: string, res: ServerResponse) {
        const resourceId = req.headers[CustomHeaders.ResourceID];
        if (!resourceId) {
            const statusCode = StatusCode.BAD_REQUEST;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: `Missing mandatory '${CustomHeaders.ResourceID}' header` }));
        }

        if (!req.url) {
            const statusCode = StatusCode.BAD_REQUEST;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: 'Invalid URL' }));
        }

        const { [CustomAttributes.Container]: containerBody } = JSON.parse(body);
        if (!containerBody) {
            const statusCode = StatusCode.BAD_REQUEST;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: `Missing (${CustomAttributes.Container})` }));
        }

        const { [ShortName.ResourceName]: resourceName } = containerBody;
        if (!resourceName) {
            const statusCode = StatusCode.BAD_REQUEST;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: `Missing (${ShortName.ResourceName}) in (${CustomAttributes.Container})` }));
        }

        // '/onem2m/app_light'
        const parts = req.url.split('/');
        // parts = [ '', 'onem2m', 'app_light' ]
        // parts[2] = 'app_light' (eg: app_light is the application entity name)
        const createdContainer = this.service.createContainer(resourceName, resourceId as string, parts[2]);

        if (!createdContainer) {
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
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
            const statusCode = StatusCode.BAD_REQUEST;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: `Missing mandatory '${CustomHeaders.ResourceID}' header` }));
        }

        if (!req.url) {
            const statusCode = StatusCode.BAD_REQUEST;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: 'Invalid URL' }));
        }

        const { [CustomAttributes.ContentInstance]: contentInstanceBody } = JSON.parse(body);
        if (!contentInstanceBody) {
            const statusCode = StatusCode.BAD_REQUEST;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: `Missing (${CustomAttributes.ContentInstance})` }));
        }

        const {
            [ShortName.ResourceName]: resourceName,
            [ShortName.Content]: content,
        } = contentInstanceBody;

        if (!resourceName) {
            const statusCode = StatusCode.BAD_REQUEST;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: `Missing (${ShortName.ResourceName}) in (${CustomAttributes.ContentInstance})` }));
        }

        if (!content) {
            const statusCode = StatusCode.BAD_REQUEST;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
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
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: 'Something went wrong while creating content Instance' }));
        }

        res.writeHead(201, {
            [CustomHeaders.ResourceID]: createdContentInstance[ShortName.ResourceID],
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ContentInstance}`,
        });

        return res.end(JSON.stringify({ [CustomAttributes.ContentInstance]: createdContentInstance }));
    }
}
