import { createRouter, createMemoryHistory, createWebHistory } from 'vue-router';
const HomePage = () => import('./pages/HomePage.jsx');
const PostPage = () => import('./pages/PostPage.jsx');
const ArchivePage = () => import('./pages/ArchivePage.jsx');
const StreamPage = () => import('./pages/StreamPage.jsx');
const AllPage = () => import('./pages/AllPage.jsx');
const KbIndexPage = () => import('./pages/KbIndexPage.jsx');
const KbEntryPage = () => import('./pages/KbEntryPage.jsx');
const InventoryPage = () => import('./pages/InventoryPage.jsx');
const TimelinePage = () => import('./pages/TimelinePage.jsx');
const SongsPage = () => import('./pages/SongsPage.jsx');
const NotFoundPage = () => import('./pages/NotFoundPage.jsx');

export function makeRouter(server = false) {
  return createRouter({
    history: server ? createMemoryHistory('/notes/') : createWebHistory('/notes/'),
    routes: [
      {path:'/',component:HomePage},
      {path:'/archive',component:ArchivePage},
      {path:'/stream',component:StreamPage},
      {path:'/all',component:AllPage},
      {path:'/kb',component:KbIndexPage},
      {path:'/kb/:slug',component:KbEntryPage},
      {path:'/inventory',component:InventoryPage},
      {path:'/timeline',component:TimelinePage},
      {path:'/songs',component:SongsPage},
      {path:'/404',component:NotFoundPage},
      {path:'/:slug',component:PostPage},
      {path:'/:pathMatch(.*)*',component:NotFoundPage},
    ],
    scrollBehavior(to, from, saved) {
      if (saved) return saved;
      if (to.hash) return {el:to.hash,top:16,behavior:'smooth'};
      if (to.path !== from.path) return {top:0};
      return false;
    },
  });
}
