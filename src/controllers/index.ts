import { IncomingMessage, ServerResponse } from 'http';
import { Service } from '../services/index';
import { CustomHeaders, CustomAttributes, ResourceType, ShortName, StatusCode, HTTPStatusCodeMapping } from '../types/index';
import { CSE_NAME, JSON_CONTENT_TYPE } from '../constants/index';
import {
    isApplicationEntityCreateRequest,
    isApplicationEntityGetRequest,
    isContainerCreateRequest,
    isContentInstanceCreateRequest,
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

                if (isApplicationEntityGetRequest(request)) return this.getAEs(request, response, requestID as string);

                if (isContainerCreateRequest(request)) return this.getContainers(request, response, requestID as string);

                const statusCode = StatusCode.NOT_FOUND;
                response.writeHead(HTTPStatusCodeMapping[statusCode], {
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

    private notImplemented(request: IncomingMessage, response: ServerResponse, requestId: string) {
        const statusCode = StatusCode.NOT_IMPLEMENTED;
        response.writeHead(HTTPStatusCodeMapping[statusCode], {
            [CustomHeaders.RequestID]: requestId,
            [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
            [CustomHeaders.StatusCode]: statusCode,
        });
        response.end();
    }

    private getAEs(request: IncomingMessage, response: ServerResponse, requestId: string) {
        if (!request.url || !request.headers.host) {
            const statusCode = StatusCode.BAD_REQUEST;
            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                [CustomHeaders.RequestID]: requestId,
                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                [CustomHeaders.StatusCode]: statusCode,
            });
            return response.end(JSON.stringify({ error: 'Invalid URL' }));
        }

        // Parse URL e query-params
        const url = new URL(request.url, `http://${request.headers.host}`);
        const fu = url.searchParams.has('fu') ? Number(url.searchParams.get('fu')) : 2;  // default fu = 2 (full resources)
        const rty = url.searchParams.has('rty') ? Number(url.searchParams.get('rty')) : ResourceType.ApplicationEntity;

        // 3) Se pedirem outro tipo de recurso, devolve vazio
        if (rty !== ResourceType.ApplicationEntity) {
            response.writeHead(HTTPStatusCodeMapping[StatusCode.OK], {
                [CustomHeaders.RequestID]: requestId,
                [CustomHeaders.ContentType]: `${JSON_CONTENT_TYPE};${ShortName.Type}=${ResourceType.ApplicationEntity}`,
                [CustomHeaders.StatusCode]: StatusCode.OK,
            });
            // só uris ou só array vazio
            if (fu === 1) {
                return response.end(JSON.stringify({ [CustomAttributes.UriPath]: [] }));
            } else {
                return response.end(JSON.stringify({ [CustomAttributes.ApplicationEntity]: [] }));
            }
        }

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

    private getContainers(request: IncomingMessage, response: ServerResponse, requestId: string) {
        return this.notImplemented(request, response, requestId);
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

        const { [ShortName.ResourceName]: resourceName, [ShortName.Content]: content } = contentInstanceBody;

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
}
