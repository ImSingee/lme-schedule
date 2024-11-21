import { parse } from "https://deno.land/std@0.202.0/flags/mod.ts";
import { getDay, getDaysInMonth } from "npm:date-fns@4.1.0";
import { fromZonedTime } from 'npm:date-fns-tz@3.2.0';

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

type ClassType = "ddm" | "pirf" | "elite" | "action" | "ama";

type CEvent = {
    title: string,
    type: ClassType,
    coach: string,
    start: Date,
    startUtc: {
        day: number,
        hour: number,
    },
    end: Date,
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

    constructor(year: number, month: number) {
        this.year = year;
        this.month = month;

        this.daysInMonth = getDaysInMonth(new Date(year, month - 1));
        this.firstWeekday = getDay(new Date(year, month - 1, 1)) || 7;
    }

    generateEventsForClasses(schedule: Schedule) {
        const events: CEvent[] = [];
        const type = getType(schedule.title)

        for (const classItem of schedule.classes) {
            for (let day = 1; day <= this.daysInMonth; day++) {
                const dayOfWeek = (this.firstWeekday + day - 2) % 7 + 1; // [1, 7] for Monday to Sunday

                if (dayOfWeek !== classItem.day) continue;
                if (classItem.only && !classItem.only.includes(day)) continue;
                if (schedule.noDays && schedule.noDays.includes(day)) continue;

                const [hour, minute] = this.parseTime(classItem.time);

                const start = this.date(day, hour, minute)

                events.push({
                    title: `${schedule.title} Live Class @ ${classItem.coach}`,
                    type,
                    coach: getCoach(classItem.coach),
                    start,
                    startUtc: {
                        day: start.getUTCDay(),
                        hour: start.getUTCHours(),
                    },
                    end: this.date(day, hour, minute + 30),
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

    private date(day: number, hour: number, min: number): Date {
        const laDate = new Date(
            this.year,
            this.month - 1, 
            day,
            hour,
            min
        );

        return fromZonedTime(laDate, 'America/Los_Angeles') 

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

function getType(title: string): ClassType {
    switch (title) {
        case 'DDM':
            return "ddm"
        case 'PIRF':
            return "pirf"
        case 'Elite Sessions':
            return 'elite'
        case 'Action English':
            return 'action'
        case 'AMA':
            return 'ama'
        default:
            throw new Error(`Unknown class type ${title}`)
    }
}

function getCoach(full: string): string {
    const match = full.match(/Coach ([A-Za-z]+)/);
    if (!match) {
        throw new Error(`Invalid coach name ${full}`);
    }
    return match[1].toLowerCase();
}

function generateEvents(jsonData: string, year: number, month: number): CEvent[] {
    const schedules: Schedule[] = JSON.parse(jsonData);
    const generator = new Generator(year, month);
    const events = generator.generateEventsForSchedules(schedules);

    return events;
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
        const events = generateEvents(jsonData, year, month);
        console.log(JSON.stringify(events, null, 2));
    } catch (error) {
        console.error('Error:', error.message);
        Deno.exit(1);
    }
}

if (import.meta.main) {
    main();
}