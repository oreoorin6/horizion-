'use client'

import React, { useState } from 'react'
import { Button } from './ui/button'

interface NetworkErrorBannerProps {
  error: string
  onRetry?: () => void
}

export default function NetworkErrorBanner({ error, onRetry }: NetworkErrorBannerProps) {
  const [showDetails, setShowDetails] = useState(false)

  return (
    <div className="bg-red-900 border border-red-700 rounded-lg p-4 mb-6 text-white">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            Network Error
          </h3>
          <p className="text-red-200">
            {error.includes('CORS') ? 
              'API access blocked by CORS policy. We need to use a proxy to access the e621.net API.' : 
              error}
          </p>
        </div>
        <div className="flex space-x-2">
          {onRetry && (
            <Button 
              onClick={onRetry}
              size="sm"
              variant="secondary"
              className="bg-red-700 hover:bg-red-600 text-white"
            >
              Retry
            </Button>
          )}
          <Button
            onClick={() => setShowDetails(!showDetails)}
            size="sm"
            variant="ghost"
            className="text-red-200 hover:text-white hover:bg-red-800"
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-4 p-3 bg-red-950 rounded border border-red-800 text-red-200">
          <h4 className="font-medium mb-2">Technical Details</h4>
          <div className="text-xs font-mono whitespace-pre-wrap">{error}</div>
          
          <div className="mt-4">
            <h4 className="font-medium mb-2">Possible Solutions</h4>
            <ul className="list-disc pl-5 text-sm space-y-1">
              <li>Use the API proxy server (already implemented)</li>
              <li>Check if the e621.net API is available</li>
              <li>Verify your internet connection</li>
              <li>Check for browser extensions that might block requests</li>
            </ul>
          </div>
          
          <div className="mt-4 flex gap-2">
            <Button 
              onClick={() => {
                import('@/lib/api/e621').then(({ e621api }) => {
                  if (e621api && typeof e621api.testDirectApiAccess === 'function') {
                    e621api.testDirectApiAccess()
                      .then(result => console.log('API diagnostic test result:', result))
                      .catch(err => console.error('API diagnostic test failed:', err));
                  }
                });
              }}
              size="sm"
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              Run API Diagnostic
            </Button>
            
            <Button 
              onClick={() => {
                const url = 'https://e621.net/posts.json?limit=1&tags=rating:s';
                console.log('Testing direct fetch to:', url);
                fetch(url, {
                  headers: {
                    'User-Agent': 'E621Horizon/1.0',
                    'Accept': 'application/json'
                  }
                })
                .then(response => {
                  console.log('Direct API response status:', response.status);
                  return response.json();
                })
                .then(data => {
                  console.log('Direct API response data:', data);
                })
                .catch(err => {
                  console.error('Direct API fetch error:', err);
                });
              }}
              size="sm"
              className="bg-purple-600 hover:bg-purple-500 text-white"
            >
              Test Direct Fetch
            </Button>
          </div>
          
          {/* Add the API tester component */}
          <div className="mt-6">
            <h4 className="font-medium mb-2">API Testing Tool</h4>
            {/* @ts-ignore */}
            {typeof window !== 'undefined' && <React.Suspense fallback={<div>Loading API tester...</div>}>
              {/* Import dynamically to prevent SSR issues */}
              {React.createElement(React.lazy(() => import('@/components/ApiTester')))}
            </React.Suspense>}
          </div>
        </div>
      )}
    </div>
  )
}