'use client';

import dynamic from 'next/dynamic';

// Use dynamic import to prevent SSR issues with the download panel
const DownloadPanel = dynamic(
  () => import('../components/download/DownloadPanel'),
  { ssr: false }
);

export default function ClientDownloadPanel() {
  return <DownloadPanel />;
}