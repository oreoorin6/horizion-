import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import ApiProvider from '@/context/ApiProvider';
import { SearchProvider } from '@/context/SearchProvider'
import { HomeSettingsProvider } from '@/context/HomeSettingsProvider'
import { DownloadManagerProvider } from '../lib/download-manager'
import ClientDownloadPanel from '../components/ClientDownloadPanel'
import DebugConsole from '../components/DebugConsole'
import UpdateBanner from '../components/UpdateBanner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'E621 Horizon',
  description: 'A modern e621 browser application',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ApiProvider>
          <SearchProvider>
            <HomeSettingsProvider>
              <DownloadManagerProvider>
                <div className="bg-overlay fixed inset-0 bg-background/80 backdrop-blur-sm" style={{ zIndex: -1 }} />
                <UpdateBanner />
                {children}
                <ClientDownloadPanel />
                <DebugConsole title="E621 Horizon Debug Console" />
              </DownloadManagerProvider>
            </HomeSettingsProvider>
          </SearchProvider>
        </ApiProvider>
      </body>
    </html>
  )
}