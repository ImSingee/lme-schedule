import {Hono} from 'hono'
import {HTTPException} from 'hono/http-exception';
import {errorToResponse, HTTP404} from './error';

import indexHtml from './index.html'

import {generateICS} from './ics';
import { getEvents } from './events';
import { applyFilter } from './filter';



const app = new Hono()

app.onError((error, _c) => {
    if (error instanceof HTTPException) {
        return error.getResponse();
    }

    return errorToResponse(error);
});
app.notFound(() => {
    throw HTTP404;
});

app.get('/', (c) => c.html(indexHtml))

function getFilteredEvents(url: string) {
    const filter = new URL(url).search

    return applyFilter(getEvents(), filter)
}

app.get('/events', (c) => c.json(getFilteredEvents(c.req.url)))

app.get('/ics', async (c) => {
    const icsString = await generateICS(getFilteredEvents(c.req.url));

    return c.text(icsString)
})

export default app
