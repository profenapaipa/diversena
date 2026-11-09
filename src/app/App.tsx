import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { HomePage } from '../pages/HomePage';
import { LearnPage } from '../pages/LearnPage';
import { IdentifyPage } from '../pages/IdentifyPage';
import { ExplorePage } from '../pages/ExplorePage';
import { ReferenceCapturePage } from '../pages/ReferenceCapturePage';
import { ProfilePage } from '../pages/ProfilePage';
import { TrainingDataPage } from '../pages/TrainingDataPage';
import { AboutPage } from '../pages/AboutPage';
import { ContactPage } from '../pages/ContactPage';
import { Navigate } from 'react-router-dom';
import { TeamPanelPage } from '../pages/TeamPanelPage';

export function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="aprender" element={<LearnPage />} />
          <Route path="identificar" element={<IdentifyPage />} />
          <Route path="explorar" element={<ExplorePage />} />
          <Route path="perfil" element={<ProfilePage />} />
          <Route path="quienes-somos" element={<AboutPage />} />
          <Route path="contacto" element={<ContactPage />} />
          <Route path="proyecto" element={<Navigate to="/quienes-somos?abrir=proyecto" replace />} />
          <Route path="identidad" element={<Navigate to="/quienes-somos?abrir=identidad" replace />} />
          <Route path="panel" element={<TeamPanelPage />} />
          {/* Herramientas internas del equipo: enlazadas desde el pie de página, no del menú principal. */}
          <Route path="herramientas/entrenar" element={<TrainingDataPage />} />
          <Route path="herramientas/referencias" element={<ReferenceCapturePage />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
