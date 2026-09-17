import {defineConfig} from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
    plugins:[
        vue()
    ],
    build:{
        lib:{
            entry:'layerge/index.js',
            name:'Layerge',
            formats:['es','cjs'],
            fileName:(format) => {
                if (format === 'es') {
                    return 'index.mjs';
                }

                return 'index.cjs';
            }
        },
        rollupOptions:{
            external:[
                'vue',
                'vue-router'
            ],
            output:{
                globals:{
                    vue:'Vue',
                    'vue-router':'VueRouter'
                }
            }
        }
    }
});
