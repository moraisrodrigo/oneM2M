import { IncomingMessage } from "http";
import { ResourceType, ShortName } from "../types/index";
import { CSE_NAME } from "../constants/index";

const isPostRequest = (req: IncomingMessage): boolean => req.method === 'POST';

const isGetRequest = (req: IncomingMessage): boolean => req.method === 'GET';

const isDeleteRequest = (req: IncomingMessage): boolean => req.method === 'DELETE';

const isPutRequest = (req: IncomingMessage): boolean => req.method === 'PUT';

export const isCreationRequest = (req: IncomingMessage): boolean => !!req.url && isPostRequest(req) && req.url.startsWith(`/${CSE_NAME()}`);

export const isRetrievalRequest = (req: IncomingMessage): boolean => !!req.url && isGetRequest(req) && req.url.startsWith(`/${CSE_NAME()}`);

export const isApplicationEntityCreateRequest = (req: IncomingMessage): boolean => {
    const { [ShortName.Type]: type } = req.headers;

    if (!type || Number(type) !== ResourceType.ApplicationEntity) return false;

    return isPostRequest(req) && req.url === `/${CSE_NAME()}`;
}

export const isContainerCreateRequest = (req: IncomingMessage): boolean => {
    if (!req.url || !isPostRequest(req)) return false;

    // '/onem2m/app_light/'
    // parts = [ '', 'onem2m', 'app_light' ]
    const urlParts = req.url.split('/');

    if (urlParts[1] !== CSE_NAME()) return false;

    return urlParts.length === 3;
}

export const isContentInstanceCreateRequest = (req: IncomingMessage): boolean => {
    if (!req.url || !isPostRequest(req)) return false;

    // '/onem2m/app_light/'
    // parts = [ '', 'onem2m', 'app_light' ]
    const urlParts = req.url.split('/');

    if (urlParts[1] !== CSE_NAME()) return false;

    return urlParts.length === 3;
}

export const isApplicationEntityGetRequest = (req: IncomingMessage): boolean => {
    // Only allow GET requests
    if (!req.url || !isGetRequest(req)) return false;

    try {
        const baseUrl = `http://${req.headers.host}`;
        const url = new URL(req.url, baseUrl);

        let pathname = url.pathname;

        if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

        // Must be “/<CSE_NAME()>”
        const expected = `/${CSE_NAME()}`;
        if (pathname !== expected) return false;

        // 4) Não há mais segmentos após o CSE root:
        //    remove a primeira barra e vê se sobra só o nome
        const segments = pathname.split('/').filter(Boolean);
        if (segments.length !== 1) return false;

        // 5) Query‐params são permitidos (fu, rty, drt, etc.), não precisam de validação aqui
        return true;

    } catch {
        return false;
    }
};