'use client'

import { useState } from 'react'
import AppHeader from '@/components/AppHeader'
import AuthWrapper from '@/components/AuthWrapper'
import SettingsModal from '@/components/SettingsModal'
import { ApiSearchProvider } from '@/context/ApiSearchProvider'

export default function SearchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  return (
    <AuthWrapper>
      <div className="min-h-screen bg-background flex flex-col">
        <AppHeader onSettingsClick={() => setIsSettingsOpen(true)} />
        <main className="flex-1 px-6 py-8">
          <ApiSearchProvider>
            <div className="max-w-7xl mx-auto">
              {children}
            </div>
          </ApiSearchProvider>
        </main>
        <SettingsModal 
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
        />
      </div>
    </AuthWrapper>
  )
}