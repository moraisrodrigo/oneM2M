import { IncomingMessage, ServerResponse } from 'http';
import { CustomAttributes, CustomHeaders, HTTPStatusCodeMapping, ShortName, StatusCode } from '../types';
import { JSON_CONTENT_TYPE } from '../constants';
import { isManagementCommandRequest } from '../utils';
import { ManagementCommandType } from '../types/management';
import { loadEnv } from '../utils/env';
import { resetDataBase } from '../db';

export class ManagementController {
    async handleRequest(request: IncomingMessage, response: ServerResponse, stop: () => void) {
        let body = '';

        request.on('data', (chunk) => { body += chunk.toString(); });

        request.on('end', () => {
            response.setHeader(CustomHeaders.ContentType, 'application/json');

            try {
                const requestID = request.headers[CustomHeaders.RequestID];

                if (!request.url) {
                    const statusCode = StatusCode.BAD_REQUEST;
                    response.writeHead(HTTPStatusCodeMapping[statusCode], {
                        [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                        [CustomHeaders.StatusCode]: statusCode,
                    });
                    return response.end(JSON.stringify({ error: 'Bad Request' }));
                }

                if (isManagementCommandRequest(request)) {
                    const { [CustomAttributes.Management]: managementBody } = JSON.parse(body);

                    if (!managementBody) {
                        const statusCode = StatusCode.BAD_REQUEST;
                        response.writeHead(HTTPStatusCodeMapping[statusCode], {
                            [CustomHeaders.RequestID]: requestID,
                            [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                            [CustomHeaders.StatusCode]: statusCode,
                        });
                        return response.end(JSON.stringify({ error: `Missing (${CustomAttributes.Management})` }));
                    }


                    let { [ShortName.CommandType]: commandType } = managementBody;

                    if (!commandType) {
                        const statusCode = StatusCode.BAD_REQUEST;
                        response.writeHead(HTTPStatusCodeMapping[statusCode], {
                            [CustomHeaders.RequestID]: requestID,
                            [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                            [CustomHeaders.StatusCode]: statusCode,
                        });
                        return response.end(JSON.stringify({ error: `Missing (${ShortName.CommandType} in ${CustomAttributes.Management})` }));
                    }

                    switch (commandType) {
                        case ManagementCommandType.RESET:
                            resetDataBase();
                        case ManagementCommandType.REBOOT:
                            loadEnv();

                            const statusCode = StatusCode.OK;
                            response.writeHead(HTTPStatusCodeMapping[statusCode], {
                                [CustomHeaders.RequestID]: requestID as string,
                                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                                [CustomHeaders.StatusCode]: statusCode,
                            });
                            response.end();

                            stop();

                            return;
                        default:
                            const invalidCode = StatusCode.INVALID_CMDTYPE;
                            response.writeHead(HTTPStatusCodeMapping[invalidCode], {
                                [CustomHeaders.RequestID]: requestID as string,
                                [CustomHeaders.ContentType]: JSON_CONTENT_TYPE,
                                [CustomHeaders.StatusCode]: invalidCode,
                            });
                            response.end(JSON.stringify({ error: 'Invalid Command Type' }));
                            return;
                    }
                }

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
}
