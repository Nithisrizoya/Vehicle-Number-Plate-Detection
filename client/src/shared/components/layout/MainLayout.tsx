import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import type { Page } from '@/shared/types';

interface Props { children: React.ReactNode; page: Page; onPageChange: (p: Page) => void; }

export function MainLayout({ children, page, onPageChange }: Props) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-sky-50/60">
      <Sidebar current={page} onChange={onPageChange} collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar page={page} />
        <main className="flex-1 overflow-y-auto p-5">
          {children}
        </main>
        <Footer />
      </div>
    </div>
  );
}
