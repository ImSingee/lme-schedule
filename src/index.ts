import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception';
import { errorToResponse, HTTP404 } from './error';


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

app.get('/', (c) => c.json({ ok: true }))

export default app
