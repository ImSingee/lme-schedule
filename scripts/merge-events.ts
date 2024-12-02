import {readFile, writeFile} from 'node:fs/promises'

const dates = ['2024-08', '2024-09', '2024-10', '2024-11', '2024-12']

const allEvents = []

for (const date of dates) {
    const events = JSON.parse(await readFile(`./events/${date}.json`))
    
    allEvents.push(...events)
}

allEvents.sort((a, b) => a.start.localeCompare(b.start))

await writeFile('./events/all.json', JSON.stringify(allEvents))
