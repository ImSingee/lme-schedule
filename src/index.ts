import {Hono} from 'hono'
import {HTTPException} from 'hono/http-exception';
import {errorToResponse, HTTP404} from './error';

import {generateICS} from './ics';
import events202408 from "../events/2024-08.json";
import events202409 from "../events/2024-09.json";
import events202410 from "../events/2024-10.json";
import events202411 from "../events/2024-11.json";


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

app.get('/', (c) => c.text('Contact Bryan (contact.lme-schedule-server@singee.me) for help'))

app.get('/ics', async (c) => {
    const url = new URL(c.req.url)
    const icsString = await generateICS([...events202408 as any, ...events202409 as any, ...events202410 as any, ...events202411 as any], url.search);

    return c.text(icsString)
})

export default app
