import { parse } from "https://deno.land/std@0.202.0/flags/mod.ts";
import { createEvents } from "npm:ics@3.7.6";

type CEventIn = {
    title: string,
    start: string,
    startUtc: {
        day: number,
        hour: number,
    },
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


async function generateICS(jsonData: string, filter: string): Promise<string> {
    const eventsIn: CEventIn[] = JSON.parse(jsonData);
    const events: CEventOut[] = applyFilter(eventsIn, filter).map(e => ({
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

function applyFilter(events: CEventIn[], filter_: string): CEventIn[] {
    if (!filter_) return events;

    const filter = new URLSearchParams(filter_);

    function getSlice(key: string) {
        return filter.getAll(key).reduce((acc, val) => acc.concat(...val.split(' ')), [] as string[]).filter(v => !!v)
    }

    const filterType = getSlice('type');
    if (filterType.length > 0) {
        events = events.filter(e => filterType.includes(e.type));
    }

    const filterCoach = getSlice('coach');
    if (filterCoach.length > 0) {
        events = events.filter(e => filterCoach.includes(e.coach));
    }

    const filterTime = filter.getAll('t').filter(v => !!v).map(v => new TimeFilter(v)).filter(f => f.valid);
    if (filterTime.length > 0) {
        events = events.filter(e => filterTime.some(f => f.test(e)));
    }

    return events;
}

class TimeFilter {
    private wd: Set<number> | null;
    private h: Set<number> | null;

    readonly valid: boolean

    constructor(filter: string) {
        // wd=6+0,h=0-17+23
        const f: Record<string, string> = filter.split(',').reduce((acc, val) => {
            const [key, value] = val.split('=');
            if (value) {
                acc[key] = value;
            }
            return acc
        }, {})

        this.wd = f.wd ? TimeFilter.parseNumberRange(f.wd, 0, 6) : null;
        this.h = f.h ? TimeFilter.parseNumberRange(f.h, 0, 23) : null;


        this.valid = !!this.wd || !!this.h
    }

    test(event: CEventIn): boolean {
        if (this.wd && !this.wd.has(event.startUtc.day)) {
            return false
        }

        if (this.h && !this.h.has(event.startUtc.hour)) {
            return false
        }

        return true
    }

    private static parseNumberRange(range: string, min: number, max: number) {
        // 0-17+21-22+23
        return range.split('+').reduce((set, val) => {
            const [start, end] = val.split('-').map(v => parseInt(v));
            if (end !== undefined) {
                if (start >= min && end <= max) {
                    for (let i = start; i <= end; i++) {
                        set.add(i)
                    }
                }
            } else {
                if (start >= min && start <= max) {
                    set.add(start);
                }
            }

            return set
        }, new Set<number>())
    }
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

async function readJsonInput(filename: string): Promise<string> {
    if (filename === "-") {
        const decoder = new TextDecoder();
        const data = await Deno.readAll(Deno.stdin);
        return decoder.decode(data);
    } else {
        return await Deno.readTextFile(filename);
    }
}

async function main() {
    const args = parse(Deno.args, {
        string: ['filter'],
        default: { filter: '' },
    });

    if (args._.length === 0) {
        console.error("Error: Please provide a filename or '-' for stdin");
        Deno.exit(1);
    }

    const filename = args._[0] as string;

    try {
        const jsonData = await readJsonInput(filename);
        const icsString = await generateICS(jsonData, args.filter);
        console.log(icsString);
    } catch (error) {
        console.error('Error:', error.message);
        Deno.exit(1);
    }
}

if (import.meta.main) {
    main();
}