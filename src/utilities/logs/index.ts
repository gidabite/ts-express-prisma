enum LogLevel {
    INFO = 'INFO',
    ERROR = 'ERROR',
    WARN = 'WARN',
}
type LogTag = string;

const logFactory = (...tags: LogTag[]) => ({
    info: (message: string) => index(message, LogLevel.INFO, ...tags),
    error: (message: string) => index(message, LogLevel.ERROR, ...tags),
    warning: (message: string) => index(message, LogLevel.WARN, ...tags),
});

const index = (message: string, level: LogLevel, ...tags: LogTag[]) => {
    let logMessage = `[${new Date().toISOString()}][${level}]`;

    if (tags.length > 0) {
        logMessage += `[${tags.join('][')}]`;
    }

    console.log(`${logMessage} ${message}`);
};

export default logFactory;
