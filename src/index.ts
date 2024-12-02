import {Hono} from 'hono'
import {HTTPException} from 'hono/http-exception';
import {errorToResponse, HTTP404} from './error';
import { cache } from 'hono/cache'

import indexHtml from './index.html'
import linksHtml from './links.html'

import {generateICS} from './ics';
import { getEvents } from './events';
import { applyFilter } from './filter';
import { getBoxMessages, handleLinksAPI } from './links';

const cacheKey = '2024-12-02T04:09:00.869Z'

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
app.get('/links', (c) => c.html(linksHtml))

app.get('/api/links', cache({
    cacheName: 'links.json',
    cacheControl: 'public, max-age=10', // 10s
  }), async (c) => c.json(await handleLinksAPI()))

app.get('/links.json', cache({
    cacheName: 'links.json',
    cacheControl: 'public, max-age=10', // 10s
  }), async (c) => c.json(await getBoxMessages()))

function getFilteredEvents(url: string) {
    const filter = new URL(url).search

    console.log('getFilteredEvents', url)

    return applyFilter(getEvents(), filter)
}

app.get('/events', cache({
    cacheName: 'events>' + cacheKey,
    cacheControl: 'public, max-age=86400', // 24 hours
  }), (c) => c.json(getFilteredEvents(c.req.url)))

app.get('/ics',cache({
    cacheName: 'ics>' + cacheKey,
    cacheControl: 'public, max-age=86400', // 24 hours
  }), async (c) => {
    const icsString = await generateICS(getFilteredEvents(c.req.url));

    return c.text(icsString)
})

export default app
