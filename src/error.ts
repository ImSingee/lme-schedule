import { getReasonPhrase, StatusCodes } from 'http-status-codes';

export class HTTPError extends Error {
    private _status?: StatusCodes;
    private _statusText?: string;

    constructor(name: string, message: string, status?: StatusCodes, statusText?: string) {
        super(message);
        this.name = name;

        if (status) this._status = status;
        if (statusText) this._statusText = statusText;
    }

    get status() {
        return this._status || StatusCodes.INTERNAL_SERVER_ERROR;
    }

    get statusText() {
        return this._statusText || getReasonPhrase(this.status);
    }
}

export function errorToResponse(error: Error) {
    const bodyJson = {
        ok: false,
        error: 'Internal Server Error',
        message: 'Internal Server Error'
    };
    let status = 500;
    let statusText = 'Internal Server Error';

    if (error instanceof Error) {
        bodyJson.message = error.message;
        bodyJson.error = error.name;

        if (error instanceof HTTPError) {
            status = error.status;
            statusText = error.statusText;
        }
    }
    return new Response(JSON.stringify(bodyJson, null, 2), {
        status: status,
        statusText: statusText,
        headers: {
            'Content-Type': 'application/json'
        }
    });
}

export const HTTP404 = new HTTPError('Not Found', 'Not Found', 404);
export const HTTP405 = new HTTPError('Method Not Allowed', 'Method Not Allowed', 405);
export const HTTP400 = new HTTPError('Bad Request', 'Bad Request', 400);