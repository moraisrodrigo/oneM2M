import { IncomingMessage } from "http";
import { CustomHeaders, ResourceType, ShortName } from "../types/index";
import { CSE_NAME } from "../constants/index";

const isPostRequest = (req: IncomingMessage): boolean => req.method === 'POST';

const isGetRequest = (req: IncomingMessage): boolean => req.method === 'GET';

const isDeleteRequest = (req: IncomingMessage): boolean => req.method === 'DELETE';

const isPutRequest = (req: IncomingMessage): boolean => req.method === 'PUT';

export const isCreationRequest = (req: IncomingMessage): boolean => !!req.url && isPostRequest(req) && req.url.startsWith(`/${CSE_NAME()}`);

export const isUpdateRequest = (req: IncomingMessage): boolean => !!req.url && isPutRequest(req) && req.url.startsWith(`/${CSE_NAME()}`);

export const isDiscoveryRequest = (req: IncomingMessage): boolean => {
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

export const isApplicationEntityCreateRequest = (req: IncomingMessage): boolean => {
    // Only allow POST requests
    if (!req.url || !isPostRequest(req)) return false;

    const isValidUrl = req.url === `/${CSE_NAME()}`;

    // If URL is not exactly "/CSE_NAME", return false
    if (!isValidUrl) return false

    const { [CustomHeaders.ContentType]: contentType } = req.headers;

    // If Content-Type header is not present, return false
    if (!contentType) return false;

    const contentTypes = contentType.replace(new RegExp(' ', 'g'), '').split(';');

    // If Content-Type header does not contain at least two parts (content-type and type), return false
    if (contentTypes.length < 2) return false;

    const typeIdentifierAux = contentTypes[1].split('=');

    // if typeIdentifierAux does not have exactly two parts (['ty', '2']), return false
    if (typeIdentifierAux.length < 2) return false;

    const typeIdentifier = typeIdentifierAux[0].toLowerCase();

    const typeValue = typeIdentifierAux[1];

    // If typeIdentifier is not 'ty' or typeValue is not '2', return false
    return typeIdentifier === ShortName.Type && Number(typeValue) === ResourceType.ApplicationEntity;
}

export const isApplicationEntityUpdateRequest = (req: IncomingMessage): boolean => {
    // Only allow PUT requests
    if (!req.url || !isPutRequest(req)) return false;

    try {
        const baseUrl = `http://${req.headers.host}`;
        const url = new URL(req.url, baseUrl);

        let pathname = url.pathname;

        if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

        const segments = pathname.split('/').filter(Boolean);

        // Must be “/<CSE_NAME()>”
        const expected = `${CSE_NAME()}`;
        if (segments[0] !== expected) return false;

        if(segments.length !== 2) return false;

        return true;

    } catch {
        return false;
    }

}

export const isContainerCreateRequest = (req: IncomingMessage): boolean => {
    // Only allow POST requests
    if (!req.url || !isPostRequest(req)) return false;

    const { [CustomHeaders.ContentType]: contentType } = req.headers;

    // If Content-Type header is not present, return false
    if (!contentType) return false;

    const contentTypes = contentType.replace(new RegExp(' ', 'g'), '').split(';');

    // If Content-Type header does not contain at least two parts (content-type and type), return false
    if (contentTypes.length < 2) return false;

    const typeIdentifierAux = contentTypes[1].split('=');

    // if typeIdentifierAux does not have exactly two parts (['ty', '3']), return false
    if (typeIdentifierAux.length < 2) return false;

    const typeIdentifier = typeIdentifierAux[0].toLowerCase();

    const typeValue = typeIdentifierAux[1];

    // If type is not 'ty' or resourceType is not '3', return false
    if (typeIdentifier !== ShortName.Type || Number(typeValue) !== ResourceType.Container) return false

    // example: req.url = '/CSE_NAME/app_light/';
    // urlParts = [ 'CSE_NAME', 'app_light' ];
    const urlParts = req.url.split('/').filter(Boolean);

    return urlParts.length === 2 && urlParts[0] === CSE_NAME();
}

export const isContentInstanceCreateRequest = (req: IncomingMessage): boolean => {
    // Only allow POST requests
    if (!req.url || !isPostRequest(req)) return false;

    const { [CustomHeaders.ContentType]: contentType } = req.headers;

    // If Content-Type header is not present, return false
    if (!contentType) return false;

    const contentTypes = contentType.replace(new RegExp(' ', 'g'), '').split(';');

    // If Content-Type header does not contain at least two parts (content-type and type), return false
    if (contentTypes.length < 2) return false;

    const typeIdentifierAux = contentTypes[1].split('=');

    // if typeIdentifierAux does not have exactly two parts (['ty', '3']), return false
    if (typeIdentifierAux.length < 2) return false;

    const typeIdentifier = typeIdentifierAux[0].toLowerCase();

    const typeValue = typeIdentifierAux[1];

    // If type is not 'ty' or resourceType is not '4', return false
    if (typeIdentifier !== ShortName.Type || Number(typeValue) !== ResourceType.ContentInstance) return false

    // example: req.url = '/CSE_NAME/app_light/status';
    // urlParts = [ 'CSE_NAME', 'app_light', 'status' ];
    const urlParts = req.url.split('/').filter(Boolean);

    return urlParts.length === 3 && urlParts[0] === CSE_NAME();
}

export const isApplicationEntityRetrieveRequest = (req: IncomingMessage): boolean => {
    // Only allow GET requests
    if (!req.url || !isGetRequest(req)) return false;

    try {
        const baseUrl = `http://${req.headers.host}`;
        const url = new URL(req.url, baseUrl);

        let pathname = url.pathname;

        if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

        const segments = pathname.split('/').filter(Boolean);

        // Must be “/<CSE_NAME()>”
        const expected = `${CSE_NAME()}`;
        if (segments[0] !== expected) return false;

        if(segments.length !== 2) return false;

        // 5) Query‐params são permitidos (fu, rty, drt, etc.), não precisam de validação aqui
        return true;

    } catch {
        return false;
    }
};

export const isContainerRetrieveRequest = (req: IncomingMessage): boolean => {
    // Only allow GET requests
    if (!req.url || !isGetRequest(req)) return false;

    try {
        const baseUrl = `http://${req.headers.host}`;
        const url = new URL(req.url, baseUrl);

        let pathname = url.pathname;

        if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

        const segments = pathname.split('/').filter(Boolean);

        // Must be “/<CSE_NAME()>”
        const expected = `${CSE_NAME()}`;
        if (segments[0] !== expected) return false;

        if(segments.length !== 3) return false;

        // 5) Query‐params são permitidos (fu, rty, drt, etc.), não precisam de validação aqui
        return true;

    } catch {
        return false;
    }
};

export const isContentInstanceRetrieveRequest = (req: IncomingMessage): boolean => {
    // Only allow GET requests
    if (!req.url || !isGetRequest(req)) return false;

    try {
        const baseUrl = `http://${req.headers.host}`;
        const url = new URL(req.url, baseUrl);

        let pathname = url.pathname;

        if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);

        const segments = pathname.split('/').filter(Boolean);

        // Must be “/<CSE_NAME()>”
        const expected = `${CSE_NAME()}`;
        if (segments[0] !== expected) return false;

        if(segments.length !== 4) return false;

        // 5) Query‐params são permitidos (fu, rty, drt, etc.), não precisam de validação aqui
        return true;

    } catch {
        return false;
    }
};