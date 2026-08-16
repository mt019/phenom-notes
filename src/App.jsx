import { Route, Routes } from 'react-router-dom';
import { ScrollToTop } from '@phenomcanvas/ui';
import HomePage from './pages/HomePage.jsx';
import PostPage from './pages/PostPage.jsx';
import ArchivePage from './pages/ArchivePage.jsx';
import StreamPage from './pages/StreamPage.jsx';
import InventoryPage from './pages/InventoryPage.jsx';
import TimelinePage from './pages/TimelinePage.jsx';
import SongsPage from './pages/SongsPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/archive" element={<ArchivePage />} />
        <Route path="/stream" element={<StreamPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/songs" element={<SongsPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="/:slug" element={<PostPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}
