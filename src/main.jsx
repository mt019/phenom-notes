import { createApp, createSSRApp } from 'vue';
import { bootSitePalette } from '@phenomcanvas/ui-vue';
import './tailwind.css';
import '@phenomcanvas/ui-vue/styles.css';
import App from './App.jsx';
import { makeRouter } from './router.js';

bootSitePalette();
const router = makeRouter();
const root = document.getElementById('root');
// Vite development serves an empty root; delivered pages contain build-time HTML.
const app = (root.hasChildNodes() ? createSSRApp : createApp)(App);
app.use(router);
await router.isReady();
app.mount(root);
