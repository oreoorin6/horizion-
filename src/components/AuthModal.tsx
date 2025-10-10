'use client'

import { useState } from 'react'
import { Eye, EyeOff, Lock, User, AlertCircle } from 'lucide-react'

interface AuthModalProps {
  onLogin: (username: string, apiKey: string) => Promise<boolean>
  isLoading?: boolean
  onClose?: () => void
}

export default function AuthModal({ onLogin, isLoading = false, onClose }: AuthModalProps) {
  const [username, setUsername] = useState('')
  const [apiKey, setApiKey] = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!username.trim() || !apiKey.trim()) {
      setError('Please enter both username and API key')
      return
    }

    setIsSubmitting(true)
    setError('')

    try {
      const success = await onLogin(username.trim(), apiKey.trim())
      
      if (!success) {
        setError('Invalid credentials. Please check your username and API key.')
      }
    } catch (err) {
      setError('Failed to authenticate. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95 backdrop-blur-md">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-border/50 bg-card/95 backdrop-blur-sm p-8 shadow-2xl">
        <div className="flex flex-col space-y-1.5 text-center mb-8">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/20 border border-primary/30">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-3xl font-bold leading-none tracking-tight text-foreground">
            Authentication Required
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Please enter your e621 username and API key to continue.<br />
            Your credentials are saved locally and are not sent to any<br />
            server other than e621.net.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <label htmlFor="username" className="text-sm font-semibold leading-none text-foreground">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <input
                id="username"
                type="text"
                placeholder="Your e621 username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-input bg-background/50 pl-12 pr-4 py-3 text-sm font-medium shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50"
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          <div className="space-y-3">
            <label htmlFor="apiKey" className="text-sm font-semibold leading-none text-foreground">
              API Key
            </label>
            <div className="relative">
              <Lock className="absolute left-4 top-3.5 h-5 w-5 text-muted-foreground" />
              <input
                id="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="Your e621 API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex h-12 w-full rounded-xl border border-input bg-background/50 pl-12 pr-12 py-3 text-sm font-medium shadow-sm transition-all duration-200 placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 hover:border-primary/50"
                disabled={isSubmitting}
                required
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-4 top-3.5 h-5 w-5 text-muted-foreground hover:text-foreground transition-colors"
                disabled={isSubmitting}
              >
                {showApiKey ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              You can find your API key in your e621 account settings page.
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg p-3">
              <AlertCircle className="h-5 w-5 flex-shrink-0" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          <div className={`flex ${onClose ? 'justify-end space-x-4' : 'justify-center'} pt-6`}>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 border border-input bg-background/50 shadow-sm hover:bg-accent hover:text-accent-foreground hover:border-accent h-11 px-6 py-2"
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={isSubmitting || isLoading}
              className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 hover:shadow-xl h-11 px-8 py-2 relative overflow-hidden"
            >
              <span className={`transition-opacity duration-200 ${isSubmitting ? 'opacity-0' : 'opacity-100'}`}>
                Sign In
              </span>
              {isSubmitting && (
                <span className="absolute inset-0 flex items-center justify-center">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent"></div>
                </span>
              )}
            </button>
          </div>
        </form>

        <div className="mt-6 space-y-3 text-center text-sm text-muted-foreground">
          <div className="space-y-1">
            <p className="font-medium">How to get your API key:</p>
            <ol className="space-y-1 text-left">
              <li>1. Go to e621.net and log in</li>
              <li>2. Visit your Account page</li>
              <li>3. Look for "API Key" section</li>
              <li>4. Generate a new key if needed</li>
            </ol>
          </div>
          <p className="text-xs">
            Your credentials are stored locally and never shared with third parties.
          </p>
        </div>
      </div>
    </div>
  )
}