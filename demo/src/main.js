import {createApp} from 'vue';
import {createDemoRouter} from './router';
import App from './App.vue';

const app = createApp(App);
const router = createDemoRouter();

app.use(router);
app.mount('#app');
