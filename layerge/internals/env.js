const readNodeEnv = () => {
    try {
        const process = typeof globalThis !== 'undefined' ? globalThis.process : undefined;

        if (process && process.env && typeof process.env.NODE_ENV === 'string') {
            return process.env.NODE_ENV;
        }
    } catch {
        // ignore
    }

    return undefined;
};

const isNodeDevEnv = () => {
    const nodeEnv = readNodeEnv();

    return typeof nodeEnv === 'string' ? nodeEnv !== 'production' : false;
};

export {isNodeDevEnv, readNodeEnv};
