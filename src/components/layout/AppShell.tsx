/** Каркас приложения: меню слева на широком экране, вкладки снизу на телефоне. */
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { BottomNav } from './BottomNav';
import { OfflineBanner } from './OfflineBanner';
import { AnnouncementBanner } from './AnnouncementBanner';
import { WhatsNewDialog } from './WhatsNewDialog';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-dvh bg-page">
      <Sidebar />
      <div className="lg:pl-64">
        <TopBar />
        <OfflineBanner />
        <AnnouncementBanner />
        <main className="mx-auto w-full max-w-6xl px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-12 lg:pt-8">
          {children}
        </main>
      </div>
      <BottomNav />
      <WhatsNewDialog />
    </div>
  );
}
