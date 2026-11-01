/** Маршруты приложения. Провайдеры темы/настроек/истории — в main.tsx. */
import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import { AppPlatformBridge } from './components/app/AppPlatformBridge';
import { GrammarProvider } from './components/grammar/GrammarProvider';
import { Spinner } from './components/ui/Spinner';
import { useGrammarTopics } from './hooks/useGrammarTopics';
import { useSettings } from './hooks/useSettings';
import { useAccount } from './hooks/useAccount';
import { useSettingsSync } from './hooks/useSettingsSync';
import { StudyProvider } from './hooks/useStudy';
import TranslatePage from './pages/TranslatePage';

// Страницы Словарь, Учёба, Диалог и Профиль грузятся отдельными кусками для ускорения старта сайта.
const DictionaryPage = lazy(() => import('./pages/DictionaryPage'));
const LearnPage = lazy(() => import('./pages/LearnPage'));
const ConversationPage = lazy(() => import('./pages/ConversationPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));

// Админка грузится отдельным куском: обычным посетителям её код не нужен.
const AdminPage = lazy(() => import('./pages/AdminPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
// Ресурсы, грамматика и «Спросить у AI» — тоже отдельными кусками.
const ResourcesPage = lazy(() => import('./pages/ResourcesPage'));
const AppsPage = lazy(() => import('./pages/AppsPage'));
const GrammarPage = lazy(() => import('./pages/GrammarPage'));
const AskPage = lazy(() => import('./pages/AskPage'));
const PhrasebookPage = lazy(() => import('./pages/PhrasebookPage'));
const LetterPage = lazy(() => import('./pages/LetterPage'));
// Учёба (этап 6): повторение, карточки, наборы и упражнения — отдельными кусками.
const ReviewPage = lazy(() => import('./pages/learn/ReviewPage'));
const CardsPage = lazy(() => import('./pages/learn/CardsPage'));
const DecksPage = lazy(() => import('./pages/learn/DecksPage'));
const PracticePage = lazy(() => import('./pages/learn/PracticePage'));
const ProgressPage = lazy(() => import('./pages/learn/ProgressPage'));
// Свои списки слов (этап 8Б) — отдельными кусками.
const ListsPage = lazy(() => import('./pages/learn/ListsPage'));
const ListPage = lazy(() => import('./pages/learn/ListPage'));
// Справка (этап 8) — тоже отдельным куском.
const HelpPage = lazy(() => import('./pages/HelpPage'));
// Политика конфиденциальности и Условия использования (часть 21).
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));

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
  const { status } = useAccount();
  useSettingsSync(status === 'signedIn');
  // Список тем один на всё приложение: странице /grammar и всплывающему окну он нужен вместе.
  const topics = useGrammarTopics();

  return (
    <BrowserRouter>
      {/* Мост нативных функций Android / Android TV (статус-бар, кнопка «Назад», обновления). */}
      <AppPlatformBridge />
      {/* Карточки и прогресс учёбы: нужны «Переводу» (кнопка «В карточки») и всем экранам учёбы. */}
      <StudyProvider>
        {/* Справочник грамматики: попап темы открывается с любой страницы. */}
        <GrammarProvider topics={topics} uiLanguage={uiLanguage}>
          <AppShell>
            <Suspense fallback={<PageFallback />}>
              <Routes>
                <Route path="/" element={<TranslatePage />} />
                <Route path="/dictionary" element={<DictionaryPage />} />
                <Route path="/learn" element={<LearnPage withGrammarLink />} />
                <Route path="/learn/review" element={<ReviewPage />} />
                <Route path="/learn/cards" element={<CardsPage />} />
                <Route path="/learn/lists" element={<ListsPage />} />
                <Route path="/learn/lists/:listId" element={<ListPage />} />
                <Route path="/learn/decks" element={<DecksPage />} />
                <Route path="/learn/practice" element={<Navigate to="/learn/practice/article" replace />} />
                <Route path="/learn/practice/:type" element={<PracticePage />} />
                <Route path="/learn/progress" element={<ProgressPage />} />
                <Route path="/conversation" element={<ConversationPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/grammar" element={<GrammarPage topics={topics} />} />
                <Route path="/grammar/:slug" element={<GrammarPage topics={topics} />} />
                <Route path="/ask" element={<AskPage />} />
                <Route path="/letter" element={<LetterPage />} />
                <Route path="/phrasebook" element={<PhrasebookPage />} />
                <Route path="/about" element={<AboutPage />} />
                <Route path="/privacy" element={<PrivacyPage />} />
                <Route path="/terms" element={<TermsPage />} />
                <Route path="/help" element={<HelpPage />} />
                <Route path="/resources" element={<ResourcesPage />} />
                <Route path="/apps" element={<AppsPage />} />
                <Route path="/admin" element={<AdminPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AppShell>
        </GrammarProvider>
      </StudyProvider>
    </BrowserRouter>
  );
}
