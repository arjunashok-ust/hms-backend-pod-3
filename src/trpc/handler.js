const { createExpressMiddleware } = require('@trpc/server/adapters/express');
const { appRouter } = require('./index');
const { createContext } = require('./context');

// Express middleware serving the tRPC api. Expected failures (auth, validation, not found...) are not
// logged; anything that ends up as INTERNAL_SERVER_ERROR is a bug or an outage and is.
const trpcHandler = createExpressMiddleware({
    router: appRouter,
    createContext,
    onError({ error, path }) {
        if (error.code === 'INTERNAL_SERVER_ERROR') {
            console.error(`trpc ${path ?? '<no-path>'} failed:`, error.cause ?? error);
        }
    },
});

module.exports = { trpcHandler };
