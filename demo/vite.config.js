import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';
import {fileURLToPath, URL} from 'node:url';

export default defineConfig({
    plugins:[
        vue()
    ],
    resolve: {
        alias: {
            // Use local source during development/e2e.
            // The published package entry points to dist/ which may not exist
            // in a fresh clone until `pnpm build` is run.
            layerge: fileURLToPath(new URL('../layerge/index.js', import.meta.url))
        }
    }
});
