import { parse } from "https://deno.land/std@0.202.0/flags/mod.ts";
import { createEvents } from "npm:ics@3.7.6";
import { addHours, format, getDay, getDaysInMonth, setDay } from "npm:date-fns@2.30.0";
import { getTimezoneOffset } from "npm:date-fns-tz@2.0.0";

interface Class {
    coach: string;
    day: number;
    time: string;
    only?: number[];
}

interface Schedule {
    title: string;
    classes: Class[];
    noDays?: number[];
}

type DT = [number, number, number, number, number]

type CEvent = {
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

class Generator {
    private year: number;
    private month: number;

    private daysInMonth: number;
    private firstWeekday: number; // [1, 7] for Monday to Sunday
    private timezoneOffset: number; // in hours

    constructor(year: number, month: number) {
        this.year = year;
        this.month = month;

        this.daysInMonth = getDaysInMonth(new Date(year, month - 1));
        this.firstWeekday = getDay(new Date(year, month - 1, 1)) || 7;
        this.timezoneOffset = getTimezoneOffset('-07:00') / 1000 / 60 / 60 + (new Date().getTimezoneOffset()) / 60;
    }

    generateEventsForClasses(schedule: Schedule) {
        const events: CEvent[] = [];

        for (const classItem of schedule.classes) {
            for (let day = 1; day <= this.daysInMonth; day++) {
                const dayOfWeek = (this.firstWeekday + day - 2) % 7 + 1; // [1, 7] for Monday to Sunday

                if (dayOfWeek !== classItem.day) continue;
                if (classItem.only && !classItem.only.includes(day)) continue;
                if (schedule.noDays && schedule.noDays.includes(day)) continue;

                const [hour, minute] = this.parseTime(classItem.time);

                events.push({
                    title: `${schedule.title} Live Class @ ${classItem.coach}`,
                    start: this.dt(day, hour, minute),
                    end: this.dt(day, hour, minute + 30),
                    status: 'CONFIRMED',
                    busyStatus: 'BUSY',
                });
            }
        }

        return events;
    }

    generateEventsForSchedules(schedules: Schedule[]) {
        const events: CEvent[] = [];

        for (const schedule of schedules) {
            events.push(...this.generateEventsForClasses(schedule));
        }

        return events
    }

    private dt(day: number, hour: number, min: number): DT {
        const date = new Date(this.year, this.month - 1, day, hour - this.timezoneOffset, min);
        return [date.getFullYear(), date.getMonth() + 1, date.getDate(), date.getHours(), date.getMinutes()]
    }

    private parseTime(str: string) {
        const match = str.match(/^(\d{2})(\d{2})$/);

        if (match) {
            return [parseInt(match[1]), parseInt(match[2])] as const;
        } else {
            throw new Error('Input must be exactly four digits');
        }
    }
}

async function generateICS(jsonData: string, year: number, month: number): Promise<string> {
    const schedules: Schedule[] = JSON.parse(jsonData);
    const generator = new Generator(year, month);
    const events = generator.generateEventsForSchedules(schedules);

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
    const now = new Date();
    const args = parse(Deno.args, {
        string: ["year", "month"],
        default: { year: now.getFullYear().toString(), month: (now.getMonth() + 1).toString() },
    });

    if (args._.length === 0) {
        console.error("Error: Please provide a filename or '-' for stdin");
        Deno.exit(1);
    }

    const filename = args._[0] as string;
    const year = parseInt(args.year);
    const month = parseInt(args.month);

    try {
        const jsonData = await readJsonInput(filename);
        const icsString = await generateICS(jsonData, year, month);
        console.log(icsString);
    } catch (error) {
        console.error('Error:', error.message);
        Deno.exit(1);
    }
}

if (import.meta.main) {
    main();
}