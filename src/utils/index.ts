import { IncomingMessage } from "http";
import { ShortName } from "../types/index";
import { CSE_NAME } from "../constants/index";

export const isPostRequest = (req: IncomingMessage): boolean => req.method === 'POST';

export const isGetRequest = (req: IncomingMessage): boolean => req.method === 'GET';

export const isDeleteRequest = (req: IncomingMessage): boolean => req.method === 'DELETE';

export const isPutRequest = (req: IncomingMessage): boolean => req.method === 'PUT';

export const isApplicationEntityCreateRequest = (req: IncomingMessage): boolean => {
    if (!isPostRequest(req)) return false;

    return req.url === `/${CSE_NAME}/${ShortName.ApplicationEntity}`;
}

export const isContainerCreateRequest = (req: IncomingMessage): boolean => {
    if (!req.url || !isPostRequest(req)) return false;

    // '/onem2m/app_light/'
    // parts = [ '', 'onem2m', 'app_light' ]
    return req.url.split('/').length === 3;
}

export const isContentInstanceCreateRequest = (req: IncomingMessage): boolean => {
    if (!req.url || !isPostRequest(req)) return false;

    // '/onem2m/app_light/'
    // parts = [ '', 'onem2m', 'app_light' ]
    return req.url.split('/').length === 3;
}