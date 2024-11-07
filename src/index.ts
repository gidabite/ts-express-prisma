import 'dotenv/config';

import bodyParser from 'body-parser';
import express from 'express';
import expressWinston from 'express-winston';
import swaggerUi from 'swagger-ui-express';
import winston from 'winston';

import authMiddleware from './middlewares/auth';
import errorHandlingMiddleware from './middlewares/errorHandling';
import notFound from './middlewares/notFound';
import router from './routes';
import swaggerDocument from './swagger/index.json';
import logFactory from './utilities/logs';

const app = express();

app.use(
    '/swagger',
    swaggerUi.serve,
    swaggerUi.setup(swaggerDocument, undefined, { docExpansion: 'none' }),
)
    .use((req, _, next) => {
        req.traceId = crypto.randomUUID();
        next();
    })
    .use(
        expressWinston.logger({
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({
                    filename: 'log.log',
                }),
            ],
            dynamicMeta: (req) => {
                return {
                    traceId: req.traceId,
                };
            },
            format: winston.format.combine(
                winston.format.json(),
                winston.format.timestamp({
                    format: 'YYYY-MM-DD hh:mm:ss.SSS A',
                }),
                winston.format.align(),
                winston.format.printf(
                    (info) =>
                        `[${info.timestamp}][${info.meta.traceId}][${info.level}]: Request received ${info.message}`,
                ),
            ),
            meta: true,
            expressFormat: true,
            colorize: false,
        }),
    )
    .use(authMiddleware())
    .use(bodyParser.json())
    .use('/', router)
    .use(
        expressWinston.errorLogger({
            transports: [
                new winston.transports.Console(),
                new winston.transports.File({
                    filename: 'log.log',
                }),
            ],
            dynamicMeta: (req) => {
                return {
                    traceId: req.traceId,
                };
            },
            format: winston.format.combine(
                winston.format.timestamp({
                    format: 'YYYY-MM-DD hh:mm:ss.SSS A',
                }),
                winston.format.align(),
                winston.format.printf(
                    (info) =>
                        `[${info.timestamp}][${info.meta.traceId}][${info.level}]: ${JSON.stringify(info.meta.error)}`,
                ),
            ),
        }),
    )
    .use(notFound)
    .use(errorHandlingMiddleware);

app.listen(3000, async () => {
    logFactory().info('Express server initialized');
});

export default app;
