/** Маршруты приложения. Провайдеры темы/настроек/истории — в main.tsx. */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { GrammarProvider } from './components/grammar/GrammarProvider';
import { Spinner } from './components/ui/Spinner';
import { useGrammarTopics } from './hooks/useGrammarTopics';
import { useSettings } from './hooks/useSettings';
import TranslatePage from './pages/TranslatePage';
import DictionaryPage from './pages/DictionaryPage';
import LearnPage from './pages/LearnPage';
import ConversationPage from './pages/ConversationPage';
import ProfilePage from './pages/ProfilePage';

// Админка грузится отдельным куском: обычным посетителям её код не нужен.
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
// Ресурсы, грамматика и «Спросить у AI» — тоже отдельными кусками.
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const GrammarPage = lazy(() => import('./pages/GrammarPage'));
const AskPage = lazy(() => import('./pages/AskPage'));

function PageFallback() {
  // Пустая обёртка со спиннером: блок не прыгает при загрузке куска.
  return (
    <div className="flex items-center justify-center py-16">
      <Spinner className="h-6 w-6 text-muted" />
    </div>
  );
}

export default function App() {
  const { uiLanguage } = useSettings();
  // Список тем один на всё приложение: странице /grammar и всплывающему окну он нужен вместе.
  const topics = useGrammarTopics();

  return (
    <BrowserRouter>
      {/* Справочник грамматики: попап темы открывается с любой страницы. */}
      <GrammarProvider topics={topics} uiLanguage={uiLanguage}>
        <AppShell>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              <Route path="/" element={<TranslatePage />} />
              <Route path="/dictionary" element={<DictionaryPage />} />
              <Route path="/learn" element={<LearnPage withGrammarLink />} />
              <Route path="/conversation" element={<ConversationPage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/grammar" element={<GrammarPage topics={topics} />} />
              <Route path="/grammar/:slug" element={<GrammarPage topics={topics} />} />
              <Route path="/ask" element={<AskPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/resources" element={<ResourcesPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </AppShell>
      </GrammarProvider>
    </BrowserRouter>
  );
}
