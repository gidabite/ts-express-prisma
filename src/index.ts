import express from 'express';
import bodyParser from 'body-parser';
import winston from 'winston';
import expressWinston from 'express-winston';
import swaggerUi from 'swagger-ui-express';

import swaggerDocument from './swagger/index.json';
import logFactory from './utilities/logs';
import { authMiddleware } from './middlewares/auth';
import errorHandlingMiddleware from './middlewares/errorHandling';
import router from './routes';

const app = express();

app.use('/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
    .use((req, res, next) => {
        req['traceId'] = crypto.randomUUID();
        next();
    })
    .use(authMiddleware())
    .use(bodyParser.json())
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
    .use(errorHandlingMiddleware);

app.listen(3000, async () => {
    logFactory().info('Express server initialized');
});
