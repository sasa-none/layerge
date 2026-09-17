import {createApp} from 'vue';
import {createRouter, createWebHistory} from 'vue-router';
import {createLayergeRouter} from 'layerge';
import App from './App.vue';
import HomePage from './HomePage.vue';
import ModalPresenter from './ModalPresenter.vue';
import OverlayPage from './OverlayPage.vue';

const router = createRouter({
    history: createWebHistory(),
    routes: [
        {path: '/', component: HomePage},
        {path: '/overlay', component: OverlayPage}
    ]
});

const layergeRouter = createLayergeRouter({
    router,
    presenters: {
        modal: {
            component: ModalPresenter
        }
    }
});

createApp(App).use(layergeRouter).mount('#app');
