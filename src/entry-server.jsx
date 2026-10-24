import { createSSRApp } from 'vue';
import { renderToString } from '@vue/server-renderer';
import App from './App.jsx';
import { makeRouter } from './router.js';

export async function render(url) {
  const router = makeRouter(true);
  const app = createSSRApp(App);
  app.use(router);
  await router.push(url.replace(/^\/notes(?=\/|$)/, '') || '/');
  await router.isReady();
  return renderToString(app);
}
