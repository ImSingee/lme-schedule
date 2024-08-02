## data json

存储在 data 目录下

```ts
type DataFile = Classes[]

interface Classes {
    title: string; // 课程类别标题，例如 DDM
    classes: Class[];
    noDays?: number[]; // 哪些日期不安排课程，例如一个月的前五天不安排课程则为 [1,2,3,4,5]
}

interface Class {
    coach: string; // 老师名字，例如 Coach Shane
    day: number; // 周几重复，1-7 代表周一到周日
    time: string; // HHMM 的形式，1:00am 为 0100，1:00pm 为 1300，NOON 等无确切时间的使用一个最合适的值，
    only?: number[]; // 只有在特殊标记不是所有日期都有课时才需要，写出到底是周几上课的日期，例如 August 9th and 23rd 则为 [9, 23]
}
```

利用 AI 生成：https://monica.im/home/chat/Monica/monica?convId=conv%3Aad200624-71d4-4718-b255-e6384c8c8cd5

预览 JSON：https://monica.im/share/artifact?id=BTgrVcL3Eq6FmJjEVzM3Q5

## event json

存储在 events 目录下

生成命令：

```bash
deno run -A scripts/generate-events.ts data/2024-08.json > events/2024-08.json
```

```ts
type EventsFile = Event[]

type ClassType = "ddm" | "pirf" | "elite" | "action" | "ama";

type CEvent = {
    title: string, // 日程标题，类似 DDM Live Class @ Coach Shane
    type: ClassType, // 课程类型
    coach: string, // Coach 名称，小写代号，Coach Shane 为 shane
    start: Date, // 开始时间
    end: Date, // 结束时间（目前固定为开始时间 + 30min）
    description?: string,
    location?: string,
    url?: string,
    status?: 'CONFIRMED' | 'TENTATIVE' | 'CANCELLED',
    busyStatus?: 'FREE' | 'BUSY',
    categories?: string[],
    uid?: string,
}
```

## ics

存储在 ics 目录下

生成命令：

```
deno run -A scripts/generate-ics.ts events/2024-08.json > ics/2024-08.json
```