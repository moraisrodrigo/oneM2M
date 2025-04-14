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
    const urlParts = req.url.split('/');

    if (urlParts[1] !== CSE_NAME) return false;

    return urlParts.length === 3;
}

export const isContentInstanceCreateRequest = (req: IncomingMessage): boolean => {
    if (!req.url || !isPostRequest(req)) return false;

    // '/onem2m/app_light/'
    // parts = [ '', 'onem2m', 'app_light' ]
    const urlParts = req.url.split('/');

    if (urlParts[1] !== CSE_NAME) return false;

    return urlParts.length === 3;
}

export const isApplicationEntityGetRequest = (req: IncomingMessage): boolean => {
    if (!req.url || !isGetRequest(req)) return false;

    try {
        const url = new URL(req.url, `http://${req.headers.host}`);

        const urlParts = url.pathname.split('/');

        if (urlParts[1] !== CSE_NAME) return false;

        return urlParts.length === 2;
    } catch {
        return false;
    }
}