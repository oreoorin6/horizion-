'use client'

import { useState } from 'react'

interface TestResult {
  status: string
  data?: any
  error?: string
}

export default function ApiTester() {
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState<TestResult | null>(null)
  const [testEndpoint, setTestEndpoint] = useState('posts.json')
  const [testTags, setTestTags] = useState('safe')
  const [testLimit, setTestLimit] = useState(2)

  const runProxyTest = async () => {
    setLoading(true)
    setResults(null)
    
    try {
      // Build the URL for our API proxy
      const proxyUrl = new URL('/api/proxy', window.location.origin)
      proxyUrl.searchParams.set('endpoint', testEndpoint)
      proxyUrl.searchParams.set('tags', testTags)
      proxyUrl.searchParams.set('limit', String(testLimit))
      
      console.log('Testing proxy API URL:', proxyUrl.toString())
      
      // Make the request
      const response = await fetch(proxyUrl.toString())
      const status = `${response.status} ${response.statusText}`
      
      if (!response.ok) {
        // Try to get the error details from the response
        let errorDetails = 'Unknown error'
        try {
          const errorData = await response.json()
          errorDetails = JSON.stringify(errorData)
        } catch (e) {
          errorDetails = await response.text() || 'Failed to parse error response'
        }
        
        setResults({
          status,
          error: errorDetails
        })
      } else {
        // Process successful response
        const data = await response.json()
        setResults({
          status,
          data
        })
      }
    } catch (error) {
      setResults({
        status: 'Client Error',
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-4 my-4">
      <h2 className="text-xl font-semibold mb-4 text-white">API Tester</h2>
      
      <div className="flex flex-wrap gap-2 mb-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Endpoint</label>
          <input
            type="text"
            value={testEndpoint}
            onChange={(e) => setTestEndpoint(e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded-md border border-gray-700 text-sm w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Tags</label>
          <input
            type="text"
            value={testTags}
            onChange={(e) => setTestTags(e.target.value)}
            className="bg-gray-800 text-white px-3 py-2 rounded-md border border-gray-700 text-sm w-full"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">Limit</label>
          <input
            type="number"
            value={testLimit}
            onChange={(e) => setTestLimit(Number(e.target.value))}
            className="bg-gray-800 text-white px-3 py-2 rounded-md border border-gray-700 text-sm w-24"
          />
        </div>
      </div>
      
      <div className="mb-4">
        <button
          onClick={runProxyTest}
          disabled={loading}
          className={`px-4 py-2 rounded-md text-sm font-medium ${
            loading
              ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {loading ? 'Testing...' : 'Test API Proxy'}
        </button>
      </div>
      
      {results && (
        <div className="mt-4">
          <h3 className="text-lg font-medium mb-2 text-white">Results</h3>
          <div className="bg-gray-800 p-3 rounded-md border border-gray-700">
            <div className="mb-2">
              <span className="text-gray-400 font-medium">Status:</span>{' '}
              <span
                className={results.error ? 'text-red-400' : 'text-green-400'}
              >
                {results.status}
              </span>
            </div>
            
            {results.error ? (
              <div>
                <span className="text-gray-400 font-medium">Error:</span>
                <pre className="mt-1 bg-gray-900 p-2 rounded text-red-300 text-xs overflow-auto max-h-60">
                  {results.error}
                </pre>
              </div>
            ) : (
              <div>
                <span className="text-gray-400 font-medium">Data:</span>
                <pre className="mt-1 bg-gray-900 p-2 rounded text-green-300 text-xs overflow-auto max-h-60">
                  {JSON.stringify(results.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}