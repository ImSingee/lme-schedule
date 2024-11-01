import events202408 from "../events/2024-08.json";
import events202409 from "../events/2024-09.json";
import events202410 from "../events/2024-10.json";
import events202411 from "../events/2024-11.json";

export type TimeInfo = {
    day: number,
    hour: number,
}

export type CEventIn = {
    title: string,
    start: string,
    startUtc: TimeInfo,
    end: string,
    type: string,
    coach: string,
    description?: string,
    location?: string,
    url?: string,
    status?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED',
    busyStatus?: 'FREE' | 'BUSY',
    categories?: string[],
    uid?: string,
}

export function getEvents(): CEventIn[] {
    return [...events202408 as any, ...events202409 as any, ...events202410 as any, ...events202411 as any]
}