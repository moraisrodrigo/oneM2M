import { IncomingMessage } from "http";
import { ShortName } from "../types/index";
import { CSE_NAME } from "../constants/index";

export const isPostRequest = (req: IncomingMessage): boolean => req.method === 'POST';

export const isGetRequest = (req: IncomingMessage): boolean => req.method === 'GET';

export const isDeleteRequest = (req: IncomingMessage): boolean => req.method === 'DELETE';

export const isPutRequest = (req: IncomingMessage): boolean => req.method === 'PUT';

export const isApplicationEntityCreateRequest = (req: IncomingMessage): boolean => {
    if (!isPostRequest(req)) return false;

    return req.url === `/${CSE_NAME()}/${ShortName.ApplicationEntity}`;
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
  // 1) Só GET
  if (!req.url || !isGetRequest(req)) return false;

  try {
    // Precisamos de uma base completa pra usar URL
    const base = `http://${req.headers.host}`;
    const url = new URL(req.url, base);

    // 2) Normaliza o pathname: remove eventual slash no fim
    let pathname = url.pathname;

    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }

    // 3) Deve ser exatamente “/<CSE_NAME()>”
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