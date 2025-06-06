import { IncomingMessage, ServerResponse } from 'http';
import { Service } from '../services/index';
import { CustomHeaders, CustomAttributes, ResourceType, ShortName, StatusCode, HTTPStatusCodeMapping } from '../types/index';
import { PORT, APP_URL, CSE_ID, CSE_NAME, CSE_CREATION_TIME, JSON_CONTENT_TYPE } from '../constants/index';
import {
    isApplicationEntityCreateRequest,
    isContainerCreateRequest,
    isContentInstanceCreateRequest,
    isCreationRequest,
    isDiscoveryRequest,
    isApplicationEntityRetrieveRequest,
    isContainerRetrieveRequest,
    isContentInstanceRetrieveRequest,
    isApplicationEntityUpdateRequest,
    isUpdateRequest,
    isContainerUpdateRequest,
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

                if (isUpdateRequest(req)) return this.updateRequest(req, body, res);

                if (isDiscoveryRequest(req)) return this.discoveryRequest(req, res);

                if (isApplicationEntityRetrieveRequest(req)) return this.retrieveAE(req, res);

                if (isContainerRetrieveRequest(req)) return this.retrieveContainer(req, res);

                if (isContentInstanceRetrieveRequest(req)) return this.retrieveContentInstance(req, res);

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

    private updateRequest(req: IncomingMessage, body: string, res: ServerResponse) {
        if (isApplicationEntityUpdateRequest(req)) return this.updateAE(req, body, res);
        
        if (isContainerUpdateRequest(req)) return this.updateContainer(req, body, res);

        return this.notImplemented(req, res);
    }

    private discoveryRequest(req: IncomingMessage, res: ServerResponse) {
        if (req.url !== undefined) {
            const parsedUrl = new URL(req.url, `http://${req.headers.host}`);

            if (parsedUrl !== null) {

                const rcn = parseInt(parsedUrl.searchParams.get(ShortName.ResultContent) ?? "");

                if (rcn) {
                    return this.getCSEBase(req, res, rcn);
                }

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

    private getCSEBase(req: IncomingMessage, res: ServerResponse, rcn: Number) {
        let payload = null;

        if (rcn === 1) {
            payload = {
                [CustomAttributes.CSEBase]: {
                    [ShortName.Type]: ResourceType.CSEBase,
                    [ShortName.CreationTime]: CSE_CREATION_TIME(),
                    [ShortName.ResourceID]: CSE_ID(),
                    [ShortName.ResourceName]: CSE_NAME(),
                    [ShortName.PointOfAccess]: [
                        APP_URL() + ':' + PORT()
                    ]
                }
            };
        } else if (rcn === 4) {
            const aes = this.service.getAEs();
            const containers = this.service.getContainers();
            const contentInstances = this.service.getContentInstances();

            payload = {
                [CustomAttributes.CSEBase]: {
                    [ShortName.Type]: ResourceType.CSEBase,
                    [ShortName.CreationTime]: CSE_CREATION_TIME(),
                    [ShortName.ResourceID]: CSE_ID(),
                    [ShortName.ResourceName]: CSE_NAME(),
                    [ShortName.PointOfAccess]: [
                        APP_URL() + ':' + PORT()
                    ]
                },
                [CustomAttributes.ApplicationEntity]: aes,
                [CustomAttributes.Container]: containers,
                [CustomAttributes.ContentInstance]: contentInstances
            };
        }

        // 6) Devolve 200 OK
        const statusCode = StatusCode.OK;
        res.writeHead(HTTPStatusCodeMapping[statusCode], {
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
            [CustomHeaders.StatusCode]: statusCode,
        });

        return res.end(JSON.stringify(payload));
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

    private updateAE(req: IncomingMessage, body: string, res: ServerResponse) {
        if (req.url) {
            const baseUrl = `http://${req.headers.host}`;
            const url = new URL(req.url, baseUrl);

            let pathname = url.pathname;

            if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

            const segments = pathname.split('/').filter(Boolean);
            const resourceName = segments[1];

            // Busca a AE pelo resourceName
            let ae = this.service.getAE(resourceName);
            if (ae === undefined) {
                const statusCode = StatusCode.NOT_FOUND;
                res.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return res.end(JSON.stringify({ error: 'Not Found' }));
            }

            const updatedAE = this.service.updateAE(resourceName);

            if (!updatedAE) {
                const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
                res.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return res.end(JSON.stringify({ error: 'Something went wrong while updating AE' }));
            }

            const rcn = parseInt(url.searchParams.get(ShortName.ResultContent) ?? "");

            res.writeHead(200, {
                [CustomHeaders.ResourceID]: updatedAE[ShortName.ResourceID],
                [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
            });

            return rcn === 0 ? res.end() : res.end(JSON.stringify({ [CustomAttributes.ApplicationEntity]: updatedAE }));

        } else {
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: 'Something went wrong while updating the AE' }));
        }
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

                    if (contentInstances.length > 0) {
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
                } else {
                    payload = { [CustomAttributes.ApplicationEntity]: ae };
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

    private updateContainer(req: IncomingMessage, body: string, res: ServerResponse) {
        if (req.url) {
            const baseUrl = `http://${req.headers.host}`;
            const url = new URL(req.url, baseUrl);

            let pathname = url.pathname;

            if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

            const segments = pathname.split('/').filter(Boolean);
            const resourceName = segments[2];

            // Busca a AE pelo resourceName
            let container = this.service.getContainer(resourceName);
            if (container === undefined) {
                const statusCode = StatusCode.NOT_FOUND;
                res.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return res.end(JSON.stringify({ error: 'Not Found' }));
            }

            const updatedContainer = this.service.updateContainer(resourceName);

            if (!updatedContainer) {
                const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
                res.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return res.end(JSON.stringify({ error: 'Something went wrong while updating container' }));
            }

            const rcn = parseInt(url.searchParams.get(ShortName.ResultContent) ?? "");

            res.writeHead(200, {
                [CustomHeaders.ResourceID]: updatedContainer[ShortName.ResourceID],
                [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.Container}`,
            });

            return rcn === 0 ? res.end() : res.end(JSON.stringify({ [CustomAttributes.Container]: updatedContainer }));

        } else {
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            res.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return res.end(JSON.stringify({ error: 'Something went wrong while updating the container' }));
        }
    }

    private retrieveContainer(req: IncomingMessage, res: ServerResponse) {
        if (req.url) {
            const baseUrl = `http://${req.headers.host}`;
            const url = new URL(req.url, baseUrl);

            let pathname = url.pathname;

            if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

            const segments = pathname.split('/').filter(Boolean);
            const rn = segments[2];
            const rcn = parseInt(url.searchParams.get(ShortName.ResultContent) ?? "");

            let container = this.service.getContainer(rn);
            if (container === undefined) {
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
                let contentInstances = this.service.getContentInstancesByParentId(container[ShortName.ResourceID]);

                if (contentInstances.length > 0) {
                    payload = {
                        [CustomAttributes.Container]: container,
                        [CustomAttributes.ContentInstance]: contentInstances,
                    };
                } else {
                    payload = { [CustomAttributes.Container]: container };
                }
            } else {
                payload = { [CustomAttributes.Container]: container };
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
            return res.end(JSON.stringify({ error: 'Something went wrong while retrieving the container' }));
        }
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

    private retrieveContentInstance(req: IncomingMessage, res: ServerResponse) {
        if (req.url) {
            const baseUrl = `http://${req.headers.host}`;
            const url = new URL(req.url, baseUrl);

            let pathname = url.pathname;

            if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

            const segments = pathname.split('/').filter(Boolean);
            const rn = segments[2];
            const latest = (segments[3] === 'latest');

            let container = this.service.getContainer(rn);

            if (container === undefined) {
                const statusCode = StatusCode.NOT_FOUND;
                res.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return res.end(JSON.stringify({ error: 'Not Found' }));
            }

            let contentInstances = this.service.getContentInstancesByParentId(container[ShortName.ResourceID]);

            if (contentInstances === undefined) {
                const statusCode = StatusCode.NOT_FOUND;
                res.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return res.end(JSON.stringify({ error: 'Not Found' }));
            }

            let contentInstance = contentInstances
                .sort((a, b) => b.ct.localeCompare(a.ct))[0];

            if (segments[3] !== 'latest') {
                contentInstance = contentInstances.sort((a, b) => a.ct.localeCompare(b.ct))[0];
            }

            let payload = {
                [CustomAttributes.ContentInstance]: contentInstance
            };

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
            return res.end(JSON.stringify({ error: 'Something went wrong while retrieving the content instance' }));
        }
    }
}
