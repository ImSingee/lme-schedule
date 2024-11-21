import events from '../events/all.json'

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
    return events as CEventIn[]
}
