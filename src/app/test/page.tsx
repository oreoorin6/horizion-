'use client'

import { useState } from 'react'
import ApiDebugTool from '@/components/ApiDebugTool'

export default function TestPage() {
  const [results, setResults] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState('female rating:safe')

  const runTest = async () => {
    setLoading(true)
    try {
      console.log('Testing API with query:', query)
      
      // Test with direct API access
      let directResult
      try {
        const directUrl = `https://e621.net/posts.json?tags=${encodeURIComponent(query)}&limit=5`
        console.log('Direct URL:', directUrl)
        
        const directRes = await fetch(directUrl, {
          headers: {
            'User-Agent': 'E621Horizon/1.0',
            'Accept': 'application/json'
          },
          mode: 'cors'
        })
        
        if (directRes.ok) {
          directResult = await directRes.json()
        } else {
          directResult = { error: `${directRes.status} ${directRes.statusText}` }
        }
      } catch (e) {
        console.error('Direct API error:', e)
        directResult = { error: e instanceof Error ? e.message : String(e) }
      }
      
      // Test with proxy
      let proxyResult
      try {
        const proxyUrl = `/api/proxy?endpoint=posts.json&tags=${encodeURIComponent(query)}&limit=5`
        console.log('Proxy URL:', proxyUrl)
        
        const proxyRes = await fetch(proxyUrl)
        
        if (proxyRes.ok) {
          proxyResult = await proxyRes.json()
        } else {
          proxyResult = { error: `${proxyRes.status} ${proxyRes.statusText}` }
        }
      } catch (e) {
        console.error('Proxy API error:', e)
        proxyResult = { error: e instanceof Error ? e.message : String(e) }
      }
      
      // Test the search hook
      let searchHookResult
      try {
        import('@/hooks/useE621Search').then(({ useE621Search }) => {
          console.log('useE621Search imported, but cannot use hooks outside components')
        })
        searchHookResult = { note: 'Cannot call hooks directly in this test function' }
      } catch (e) {
        searchHookResult = { error: e instanceof Error ? e.message : String(e) }
      }
      
      setResults({
        directApi: directResult,
        proxyApi: proxyResult,
        searchHook: searchHookResult,
        timestamp: new Date().toISOString()
      })
    } catch (error) {
      console.error('Test error:', error)
      setResults({ error: error instanceof Error ? error.message : String(error) })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">E621 API Test Page</h1>
      
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 px-4 py-2 rounded-lg border border-gray-700 bg-gray-800 text-white"
            placeholder="Enter search query"
          />
          <button
            onClick={runTest}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg"
          >
            {loading ? 'Testing...' : 'Test API'}
          </button>
        </div>
        
        <div className="space-y-2 text-gray-300 text-sm">
          <p>Try some of these example queries:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><code className="bg-gray-800 px-1 rounded">female canine rating:safe</code> - Safe female canine images</li>
            <li><code className="bg-gray-800 px-1 rounded">wolf -male rating:safe</code> - Safe wolf images, no males</li>
            <li><code className="bg-gray-800 px-1 rounded">feline solo order:score</code> - Solo feline images ordered by score</li>
            <li><code className="bg-gray-800 px-1 rounded">rating:safe order:random</code> - Random safe images</li>
          </ul>
        </div>
      </div>
      
      <ApiDebugTool />
      
      {results && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-4">Test Results</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Proxy API Results</h3>
              {results.proxyApi?.error ? (
                <div className="bg-red-900/30 p-3 rounded text-red-300">
                  Error: {results.proxyApi.error}
                </div>
              ) : (
                <div>
                  <div className="mb-2">
                    <span className="text-gray-400">Posts found: </span>
                    <span className="text-white font-medium">{results.proxyApi?.posts?.length || 0}</span>
                  </div>
                  
                  <div className="overflow-auto max-h-60 bg-gray-900 p-2 rounded">
                    <pre className="text-xs text-green-300">
                      {JSON.stringify(results.proxyApi?.posts?.slice(0, 1), null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
            
            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="text-lg font-medium mb-2">Direct API Results</h3>
              {results.directApi?.error ? (
                <div className="bg-red-900/30 p-3 rounded text-red-300">
                  Error: {results.directApi.error}
                </div>
              ) : (
                <div>
                  <div className="mb-2">
                    <span className="text-gray-400">Posts found: </span>
                    <span className="text-white font-medium">{results.directApi?.posts?.length || 0}</span>
                  </div>
                  
                  <div className="overflow-auto max-h-60 bg-gray-900 p-2 rounded">
                    <pre className="text-xs text-green-300">
                      {JSON.stringify(results.directApi?.posts?.slice(0, 1), null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-6 text-sm text-gray-400">
            <p>Test completed at: {results.timestamp}</p>
          </div>
        </div>
      )}
    </div>
  )
}