import { useState } from 'react';
import { MainLayout }          from '@/shared/components/layout/MainLayout';
import { DashboardPage }       from '@/features/dashboard/DashboardPage';
import { LiveDetectionPage }   from '@/features/live-detection/LiveDetectionPage';
import { VideoDetectionPage }  from '@/features/video-detection/VideoDetectionPage';
import type { Page } from '@/shared/types';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');

  return (
    <MainLayout page={page} onPageChange={setPage}>
      {page === 'dashboard' && <DashboardPage />}
      {page === 'live-detection' && <LiveDetectionPage />}
      {/* Video Detection stays mounted (just hidden) when you switch away, so its
          results/progress survive a trip to another tab instead of resetting. */}
      <div className={page === 'video-detection' ? '' : 'hidden'}>
        <VideoDetectionPage />
      </div>
    </MainLayout>
  );
}
