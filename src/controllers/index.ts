import { IncomingMessage, ServerResponse } from 'http';
import { Service } from '../services/index';
import { CustomHeaders, CustomAttributes, ResourceType, ShortName, StatusCode, HTTPStatusCodeMapping, ContentInstance } from '../types/index';
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
import { getTimestamp } from '../utils/misc';

export class Controller {
    constructor(private service: Service) { }

    handleRequest(request: IncomingMessage, response: ServerResponse): void {
        let body = '';

        request.on('data', (chunk) => { body += chunk.toString(); });

        request.on('end', () => {
            response.setHeader(CustomHeaders.ContentType, 'application/json');

            try {
                const requestID = request.headers[CustomHeaders.RequestID];

                if (!requestID) {
                    const statusCode = StatusCode.BAD_REQUEST;
                    response.writeHead(HTTPStatusCodeMapping[statusCode], {
                        [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                        [CustomHeaders.StatusCode]: statusCode,
                    });
                    return response.end(JSON.stringify({ error: `Missing mandatory '${CustomHeaders.RequestID}' header` }));
                }

                const origin = request.headers[CustomHeaders.Origin] as string || null;

                // The Origin Header is mandatory for all requests except creation of Application Entities
                if (isApplicationEntityCreateRequest(request)) return this.createAE(body, response, requestID as string);

                if (!origin) {
                    const statusCode = StatusCode.BAD_REQUEST;
                    response.writeHead(HTTPStatusCodeMapping[statusCode], {
                        [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                        [CustomHeaders.StatusCode]: statusCode,
                    });
                    return response.end(JSON.stringify({ error: `Missing mandatory '${CustomHeaders.Origin}' header` }));
                }

                if (isContainerCreateRequest(request)) return this.createContainer(request, body, response, requestID as string);

                if (isContentInstanceCreateRequest(request)) return this.createContentInstance(request, body, response, requestID as string);

                if (isUpdateRequest(request)) return this.updateRequest(request, body, response, requestID as string);

                if (isDiscoveryRequest(request)) return this.discoveryRequest(request, response, requestID as string);

                if (isApplicationEntityRetrieveRequest(request)) return this.retrieveAE(request, response, requestID as string);

                if (isContainerRetrieveRequest(request)) return this.retrieveContainer(request, response, requestID as string);

                if (isContentInstanceRetrieveRequest(request)) return this.retrieveContentInstance(request, response, requestID as string);

                const statusCode = StatusCode.NOT_FOUND;
                response.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.RequestID]: requestID as string,
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                response.end(JSON.stringify({ error: 'Not Found' }));
            } catch (error: any) {
                const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
                response.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                response.end(JSON.stringify({ error: error?.message || 'Internal Server Error' }));
            }
        });
    }

    private updateRequest(request: IncomingMessage, body: string, response: ServerResponse, requestId: string) {
        if (isApplicationEntityUpdateRequest(request)) return this.updateAE(request, body, response, requestId);

        if (isContainerUpdateRequest(request)) return this.updateContainer(request, body, response, requestId);

        return this.notImplemented(request, response, requestId);
    }

    private discoveryRequest(request: IncomingMessage, response: ServerResponse, requestId: string) {
        if (request.url !== undefined) {
            const parsedUrl = new URL(request.url, `http://${request.headers.host}`);

            if (parsedUrl !== null) {

                const rcn = parseInt(parsedUrl.searchParams.get(ShortName.ResultContent) ?? "");

                if (rcn) {
                    return this.getCSEBase(request, response, requestId, rcn);
                }

                const fu = parseInt(parsedUrl.searchParams.get(ShortName.FilterUsage) ?? "");
                const ty = parseInt(parsedUrl.searchParams.get(ShortName.Type) ?? "");

                switch (ty) {
                    case ResourceType.ApplicationEntity:
                        return this.getAEs(request, response, requestId, fu);
                    case ResourceType.Container:
                        return this.getContainers(request, response, requestId, fu);
                    case ResourceType.ContentInstance:
                        return this.getContentInstances(request, response, requestId, fu);
                    default:
                        return this.notImplemented(request, response, requestId);
                }
            }
        }
    }

    private notImplemented(request: IncomingMessage, response: ServerResponse, requestId: string) {
        const statusCode = StatusCode.NOT_IMPLEMENTED;
        response.writeHead(HTTPStatusCodeMapping[statusCode], {
            [CustomHeaders.RequestID]: requestId,
            [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
            [CustomHeaders.StatusCode]: statusCode,
        });
        response.end();
    }

    private getCSEBase(request: IncomingMessage, response: ServerResponse, requestId: string, rcn: Number) {
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
        response.writeHead(HTTPStatusCodeMapping[statusCode], {
            [CustomHeaders.RequestID]: requestId,
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
            [CustomHeaders.StatusCode]: statusCode,
        });

        return response.end(JSON.stringify(payload));
    }

    private getAEs(request: IncomingMessage, response: ServerResponse, requestId: string, fu: Number) {
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
        response.writeHead(HTTPStatusCodeMapping[statusCode], {
            [CustomHeaders.RequestID]: requestId,
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
            [CustomHeaders.StatusCode]: statusCode,
        });

        return response.end(JSON.stringify(payload));
    }

    private getContainers(request: IncomingMessage, response: ServerResponse, requestId: string, fu: Number) {
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
        response.writeHead(HTTPStatusCodeMapping[statusCode], {
            [CustomHeaders.RequestID]: requestId,
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.Container}`,
            [CustomHeaders.StatusCode]: statusCode,
        });

        return response.end(JSON.stringify(payload));
    }

    private getContentInstances(request: IncomingMessage, response: ServerResponse, requestId: string, fu: Number) {
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
        response.writeHead(HTTPStatusCodeMapping[statusCode], {
            [CustomHeaders.RequestID]: requestId,
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ContentInstance}`,
            [CustomHeaders.StatusCode]: statusCode,
        });

        return response.end(JSON.stringify(payload));
    }

    private createAE(body: string, response: ServerResponse, requestID: string) {
        let { [ShortName.ResourceName]: resourceName } = JSON.parse(body);

        if (!resourceName) {
            // make a unique resource name if not provided
            resourceName = `ae_${getTimestamp()}`;
        }

        const createdAE = this.service.createAE(resourceName);

        if (!createdAE) {
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestID,
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: 'Something went wrong while creating AE' }));
        }

        response.writeHead(201, {
            [CustomHeaders.RequestID]: requestID,
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
        });

        return response.end(JSON.stringify({ [CustomAttributes.ApplicationEntity]: createdAE }));
    }

    private updateAE(request: IncomingMessage, body: string, response: ServerResponse, requestId: string) {
        if (request.url) {
            const baseUrl = `http://${request.headers.host}`;
            const url = new URL(request.url, baseUrl);

            let pathname = url.pathname;

            if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

            const segments = pathname.split('/').filter(Boolean);
            const resourceName = segments[1];

            // Busca a AE pelo resourceName
            let ae = this.service.getAE(resourceName);
            if (ae === undefined) {
                const statusCode = StatusCode.NOT_FOUND;
                response.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.RequestID]: requestId,
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return response.end(JSON.stringify({ error: 'Not Found' }));
            }

            const updatedAE = this.service.updateAE(resourceName);

            if (!updatedAE) {
                const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
                response.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.RequestID]: requestId,
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return response.end(JSON.stringify({ error: 'Something went wrong while updating AE' }));
            }

            const rcn = parseInt(url.searchParams.get(ShortName.ResultContent) ?? "");

            response.writeHead(200, {
                [CustomHeaders.RequestID]: requestId,
                [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
            });

            return rcn === 0 ? response.end() : response.end(JSON.stringify({ [CustomAttributes.ApplicationEntity]: updatedAE }));

        } else {
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestId,
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: 'Something went wrong while updating the AE' }));
        }
    }

    private retrieveAE(request: IncomingMessage, response: ServerResponse, requestId: string) {
        if (request.url) {
            const baseUrl = `http://${request.headers.host}`;
            const url = new URL(request.url, baseUrl);

            let pathname = url.pathname;

            if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

            const segments = pathname.split('/').filter(Boolean);
            const rn = segments[1];
            const rcn = parseInt(url.searchParams.get(ShortName.ResultContent) ?? "");

            // Busca a AE pelo resourceName
            let ae = this.service.getAE(rn);
            if (ae === undefined) {
                const statusCode = StatusCode.NOT_FOUND;
                response.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.RequestID]: requestId,
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return response.end(JSON.stringify({ error: 'Not Found' }));
            }

            let payload = null;

            if (rcn === 4) {
                // get child resources
                let containers = this.service.getContainersByParentId(ae[ShortName.ResourceID]);

                if (containers.length > 0) {
                    let contentInstances: ContentInstance[] = [];

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
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestId,
                [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
                [CustomHeaders.StatusCode]: statusCode,
            });

            return response.end(JSON.stringify(payload));
        } else {
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestId,
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: 'Something went wrong while retrieving the AE' }));
        }
    }

    private createContainer(request: IncomingMessage, body: string, response: ServerResponse, requestID: string) {
        if (!request.url) {
            const statusCode = StatusCode.BAD_REQUEST;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestID,
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: 'Invalid URL' }));
        }

        const { [CustomAttributes.Container]: containerBody } = JSON.parse(body);
        if (!containerBody) {
            const statusCode = StatusCode.BAD_REQUEST;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestID,
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: `Missing (${CustomAttributes.Container})` }));
        }

        const { [ShortName.ResourceName]: resourceName } = containerBody;
        if (!resourceName) {
            const statusCode = StatusCode.BAD_REQUEST;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestID,
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: `Missing (${ShortName.ResourceName}) in (${CustomAttributes.Container})` }));
        }

        // '/onem2m/app_light'
        const parts = request.url.split('/');
        // parts = [ '', 'onem2m', 'app_light' ]
        // parts[2] = 'app_light' (eg: app_light is the application entity name)
        const createdContainer = this.service.createContainer(resourceName, requestID, parts[2]);

        if (!createdContainer) {
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestID,
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: 'Something went wrong while creating Container' }));
        }

        response.writeHead(201, {
            [CustomHeaders.RequestID]: requestID,
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.Container}`,
        });

        return response.end(JSON.stringify({ [CustomAttributes.Container]: createdContainer }));
    }

    private updateContainer(request: IncomingMessage, body: string, response: ServerResponse, requestId: string) {
        if (request.url) {
            const baseUrl = `http://${request.headers.host}`;
            const url = new URL(request.url, baseUrl);

            let pathname = url.pathname;

            if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

            const segments = pathname.split('/').filter(Boolean);
            const resourceName = segments[2];

            // Busca a AE pelo resourceName
            let container = this.service.getContainer(resourceName);
            if (container === undefined) {
                const statusCode = StatusCode.NOT_FOUND;
                response.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.RequestID]: requestId,
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return response.end(JSON.stringify({ error: 'Not Found' }));
            }

            const updatedContainer = this.service.updateContainer(resourceName);

            if (!updatedContainer) {
                const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
                response.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.RequestID]: requestId,
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return response.end(JSON.stringify({ error: 'Something went wrong while updating container' }));
            }

            const rcn = parseInt(url.searchParams.get(ShortName.ResultContent) ?? "");

            response.writeHead(200, {
                [CustomHeaders.RequestID]: requestId,
                [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.Container}`,
            });

            return rcn === 0 ? response.end() : response.end(JSON.stringify({ [CustomAttributes.Container]: updatedContainer }));

        } else {
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestId,
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: 'Something went wrong while updating the container' }));
        }
    }

    private retrieveContainer(request: IncomingMessage, response: ServerResponse, requestId: string) {
        if (request.url) {
            const baseUrl = `http://${request.headers.host}`;
            const url = new URL(request.url, baseUrl);

            let pathname = url.pathname;

            if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

            const segments = pathname.split('/').filter(Boolean);
            const rn = segments[2];
            const rcn = parseInt(url.searchParams.get(ShortName.ResultContent) ?? "");

            let container = this.service.getContainer(rn);
            if (container === undefined) {
                const statusCode = StatusCode.NOT_FOUND;
                response.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return response.end(JSON.stringify({ error: 'Not Found' }));
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
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestId,
                [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
                [CustomHeaders.StatusCode]: statusCode,
            });

            return response.end(JSON.stringify(payload));
        } else {
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestId,
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: 'Something went wrong while retrieving the container' }));
        }
    }

    private createContentInstance(request: IncomingMessage, body: string, response: ServerResponse, requestID: string) {
        const { [CustomAttributes.ContentInstance]: contentInstanceBody } = JSON.parse(body);
        if (!contentInstanceBody) {
            const statusCode = StatusCode.BAD_REQUEST;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
                [CustomHeaders.RequestID]: requestID,
            });
            return response.end(JSON.stringify({ error: `Missing (${CustomAttributes.ContentInstance})` }));
        }

        const {
            [ShortName.ResourceName]: resourceName,
            [ShortName.Content]: content,
        } = contentInstanceBody;

        if (!resourceName) {
            const statusCode = StatusCode.BAD_REQUEST;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestID,
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: `Missing (${ShortName.ResourceName}) in (${CustomAttributes.ContentInstance})` }));
        }

        if (!content) {
            const statusCode = StatusCode.BAD_REQUEST;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestID,
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: `Missing (${ShortName.Content}) in (${CustomAttributes.ContentInstance})` }));
        }

        // request.url = '/onem2m/app_light/status'
        const url = request.url!;
        const parts = url.split('/');
        // parts = [ '', 'onem2m', 'app_light', 'status' ]
        // parts[3] = 'status' (eg: status is the container name)
        const containerName = parts[3];
        // parts[2] = 'app_light' (eg: app_light is the application entity name)
        const applicationEntityName = parts[2];
        const createdContentInstance = this.service.createContentInstance(resourceName, requestID, containerName, applicationEntityName, content);

        if (!createdContentInstance) {
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: 'Something went wrong while creating content Instance' }));
        }

        response.writeHead(201, {
            [CustomHeaders.RequestID]: requestID,
            [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ContentInstance}`,
        });

        return response.end(JSON.stringify({ [CustomAttributes.ContentInstance]: createdContentInstance }));
    }

    private retrieveContentInstance(request: IncomingMessage, response: ServerResponse, requestId: string) {
        if (request.url) {
            const baseUrl = `http://${request.headers.host}`;
            const url = new URL(request.url, baseUrl);

            let pathname = url.pathname;

            if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

            const segments = pathname.split('/').filter(Boolean);
            const rn = segments[2];
            const latest = (segments[3] === 'latest');

            let container = this.service.getContainer(rn);

            if (container === undefined) {
                const statusCode = StatusCode.NOT_FOUND;
                response.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.RequestID]: requestId,
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return response.end(JSON.stringify({ error: 'Not Found' }));
            }

            let contentInstances = this.service.getContentInstancesByParentId(container[ShortName.ResourceID]);

            if (contentInstances === undefined) {
                const statusCode = StatusCode.NOT_FOUND;
                response.writeHead(HTTPStatusCodeMapping[statusCode], {
                    [CustomHeaders.RequestID]: requestId,
                    [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                    [CustomHeaders.StatusCode]: statusCode,
                });
                return response.end(JSON.stringify({ error: 'Not Found' }));
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
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
                [CustomHeaders.StatusCode]: statusCode,
            });

            return response.end(JSON.stringify(payload));
        } else {
            const statusCode = StatusCode.INTERNAL_SERVER_ERROR;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestId,
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: 'Something went wrong while retrieving the content instance' }));
        }
    }
}
