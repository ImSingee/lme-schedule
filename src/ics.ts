import { createEvents } from "ics";
import { CEventIn } from "./events";

type DT = [number, number, number, number, number]

type CEventOut = {
    title: string,
    start: DT,
    end: DT,
    description?: string,
    location?: string,
    url?: string,
    status?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED',
    busyStatus?: 'FREE' | 'BUSY',
    categories?: string[],
    uid?: string,
}


export async function generateICS(eventsIn: CEventIn[]): Promise<string> {
    const events: CEventOut[] = eventsIn.map(e => ({
        ...pick(e, ['title', 'description', 'location', 'url', 'status', 'busyStatus', 'categories', 'uid']),
        start: getDT(e.start),
        end: getDT(e.end),
    }))


    return new Promise((resolve, reject) => {
        createEvents(events, (error: Error | undefined, value: string) => {
            if (error) {
                reject(error);
            } else {
                resolve(value);
            }
        });
    });
}

function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K> {
    const result = {} as Pick<T, K>;
    for (const key of keys) {
        if (key in obj) {
            result[key] = obj[key];
        }
    }
    return result;
}

function getDT(d: string): DT {
    const date = new Date(d);
    return [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()]
}

