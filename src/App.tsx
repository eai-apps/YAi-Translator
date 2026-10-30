/** Маршруты приложения. Провайдеры темы/настроек/истории — в main.tsx. */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { Spinner } from './components/ui/Spinner';
import TranslatePage from './pages/TranslatePage';
import DictionaryPage from './pages/DictionaryPage';
import LearnPage from './pages/LearnPage';
import ConversationPage from './pages/ConversationPage';
import ProfilePage from './pages/ProfilePage';

// Админка грузится отдельным куском: обычным посетителям её код не нужен.
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));

function PageFallback() {
  // Пустая обёртка со спиннером: блок не прыгает при загрузке куска.
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner className="h-6 w-6 text-muted" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/" element={<TranslatePage />} />
            <Route path="/dictionary" element={<DictionaryPage />} />
            <Route path="/learn" element={<LearnPage />} />
            <Route path="/conversation" element={<ConversationPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </AppShell>
    </BrowserRouter>
  );
}
