import winston from 'winston';
import config from '../config';
import path from 'path';

const transports: winston.transport[] = [];


if (process.env.NODE_ENV === 'development') {
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.timestamp({ format: 'HH:mm:ss' }),
                winston.format.printf(({ timestamp, level, message, stack }) => {
                    return stack
                        ? `[${timestamp}] ${level}: ${stack}`
                        : `[${timestamp}] ${level}: ${message}`;
                })
            )
        })
    );
} else {
    transports.push(
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    );


    transports.push(
        new winston.transports.File({
            filename: path.resolve('Logs/app.log'),
            level: config.logs.level,
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            ),
            maxsize: 5 * 1024 * 1024,
            maxFiles: 5
        })
    );
}

const LoggerInstance = winston.createLogger({
    level: config.logs.level || 'info',
    levels: winston.config.npm.levels,
    transports,
    exitOnError: false
});

export default LoggerInstance;