import { CEventIn, TimeInfo } from "./events";
import { getTimezoneOffset } from "date-fns-tz";

export function applyFilter(events: CEventIn[], filter_: string): CEventIn[] {
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
        const tz = filter.get('tz')
        const offset = tz ? getTimezoneOffset(tz) / 1000 / 60 / 60 : 0;

        events = events.map(e => fillStartLocal(e, offset)).filter(e => filterTime.some(f => f.test(e)));
    }

    return events;
}

type CEventInWithStartLocal = CEventIn & {
    startLocal: TimeInfo,
}

function fillStartLocal(e: CEventIn, offset: number): CEventInWithStartLocal {
    const ee: CEventInWithStartLocal = e as CEventInWithStartLocal;

    if (offset === 0) {
        ee.startLocal = ee.startUtc
    } else {
        ee.startLocal = adjustTime(ee.startUtc, offset)
    }

    return ee
}

function adjustTime(startUtc: TimeInfo, offsetHours: number): TimeInfo {
    let totalHours = startUtc.day * 24 + startUtc.hour + offsetHours;

    while (totalHours < 0) {
        totalHours += 7 * 24;
    }

    let newDay = Math.floor(totalHours / 24) % 7;
    let newHour = totalHours % 24;

    return {
        day: newDay,
        hour: newHour
    };
}

class TimeFilter {
    private wd: Set<number> | null;
    private h: Set<number> | null;

    readonly valid: boolean

    constructor(filter: string) {
        // wd=6+0,h=0-17+23
        const f = filter.split(',').reduce((acc, val) => {
            const [key, value] = val.split('=');
            if (value) {
                acc[key] = value;
            }
            return acc
        }, {} as Record<string, string>)

        this.wd = f.wd ? TimeFilter.parseNumberRange(f.wd, 0, 6) : null;
        this.h = f.h ? TimeFilter.parseNumberRange(f.h, 0, 23) : null;


        this.valid = !!this.wd || !!this.h
    }

    test(event: CEventInWithStartLocal): boolean {
        if (this.wd && !this.wd.has(event.startLocal.day)) {
            return false
        }

        if (this.h && !this.h.has(event.startLocal.hour)) {
            return false
        }

        return true
    }

    private static parseNumberRange(range: string, min: number, max: number) {
        // 0-17+21-22+23
        return range.split(' ').reduce((set, val) => {
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