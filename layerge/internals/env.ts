/**
 * ProcessLike - NODE_ENV の読み取りに必要な最小形
 *
 * ライブラリは Node 型定義に依存しないため、globalThis からの取り出しに用います。
 */
interface ProcessLike {
    env?: {NODE_ENV?: string};
}

const readNodeEnv = (): string | undefined => {
    try {
        const process =
            typeof globalThis !== 'undefined'
                ? (globalThis as typeof globalThis & {process?: ProcessLike}).process
                : undefined;

        if (process && process.env && typeof process.env.NODE_ENV === 'string') {
            return process.env.NODE_ENV;
        }
    } catch {
        // ignore
    }

    return undefined;
};

const isNodeDevEnv = (): boolean => {
    const nodeEnv = readNodeEnv();

    return typeof nodeEnv === 'string' ? nodeEnv !== 'production' : false;
};

export {isNodeDevEnv, readNodeEnv};
