/** Маршруты приложения. Провайдеры темы/настроек/истории — в main.tsx. */
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/layout/AppShell';
import TranslatePage from './pages/TranslatePage';
import DictionaryPage from './pages/DictionaryPage';
import LearnPage from './pages/LearnPage';
import ConversationPage from './pages/ConversationPage';
import ProfilePage from './pages/ProfilePage';

export default function App() {
  return (
    <BrowserRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<TranslatePage />} />
          <Route path="/dictionary" element={<DictionaryPage />} />
          <Route path="/learn" element={<LearnPage />} />
          <Route path="/conversation" element={<ConversationPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppShell>
    </BrowserRouter>
  );
}
