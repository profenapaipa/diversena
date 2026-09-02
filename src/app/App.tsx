import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { HomePage } from '../pages/HomePage';
import { LearnPage } from '../pages/LearnPage';
import { IdentifyPage } from '../pages/IdentifyPage';
import { ExplorePage } from '../pages/ExplorePage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="aprender" element={<LearnPage />} />
          <Route path="identificar" element={<IdentifyPage />} />
          <Route path="explorar" element={<ExplorePage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
