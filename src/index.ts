import {Hono} from 'hono'
import {HTTPException} from 'hono/http-exception';
import {errorToResponse, HTTP404} from './error';
import { cache } from 'hono/cache'

import indexHtml from './index.html'
import linksHtml from './links.html'

import {generateICS} from './ics';
import { getEvents } from './events';
import { applyFilter } from './filter';

const cacheKey = '2024-11-17T12:08:45.693Z'



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

app.get('/links.json', async (c) => {
    const response = await fetch('https://jsonbin.singee.workers.dev/lme-box', {
        headers: {
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiIwM2N1bnp1ZXdodjl1cGhlZmVvMWFwYXFvIiwiaWF0IjoxNzMxODQzNTcwLCJhIjp7ImxtZS1ib3giOiJyIn19.GVs4VE-tZFjYoyWDmMfiuD4AhaTq9C22mHgss-NlMY4'
        }
    })

    const result = await response.json<unknown[]>();

    const messages = result.reverse().slice(0, 50)
    
    return c.json(messages)
})

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
