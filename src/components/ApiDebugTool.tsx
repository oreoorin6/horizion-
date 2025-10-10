'use client'

import { Button } from './ui/button'
import { useState, useEffect } from 'react'

export default function ApiDebugTool() {
  const [apiResponses, setApiResponses] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [apiRootItems, setApiRootItems] = useState<string[]>([])

  // On mount, try to discover API paths
  useEffect(() => {
    // Just check which paths respond
    const checkPaths = async () => {
      const foundItems: string[] = []
      
      try {
        const resp = await fetch('/api')
        if (resp.ok || resp.status === 404) {
          foundItems.push(`/api returns ${resp.status} ${resp.statusText}`)
        }
      } catch (e) {
        console.log('Error checking /api:', e)
        foundItems.push(`/api error: ${e instanceof Error ? e.message : String(e)}`)
      }
      
      try {
        const resp = await fetch('/api/proxy')
        if (resp.ok) {
          foundItems.push(`/api/proxy exists and returns ${resp.status} ${resp.statusText}`)
        } else if (resp.status === 404) {
          foundItems.push(`/api/proxy returns 404 Not Found`)
        } else {
          foundItems.push(`/api/proxy returns ${resp.status} ${resp.statusText}`)
        }
      } catch (e) {
        console.log('Error checking /api/proxy:', e)
        foundItems.push(`/api/proxy error: ${e instanceof Error ? e.message : String(e)}`)
      }
      
      setApiRootItems(foundItems)
    }
    
    checkPaths()
  }, [])

  const testApi = async (endpoint: string, description: string) => {
    setLoading(true)
    try {
      const startTime = performance.now()
      const response = await fetch(endpoint)
      const endTime = performance.now()
      const latency = Math.round(endTime - startTime)
      const status = `${response.status} ${response.statusText}`
      
      let data = null
      let isJson = false
      let responseText = null
      
      // Try to parse as JSON
      const contentType = response.headers.get('content-type') || ''
      isJson = contentType.includes('application/json')
      
      try {
        if (isJson) {
          data = await response.json()
        } else {
          responseText = await response.text()
        }
      } catch (e) {
        responseText = `Error parsing response: ${e instanceof Error ? e.message : String(e)}`
      }
      
      setApiResponses(prev => ({
        ...prev,
        [description]: {
          endpoint,
          status,
          latency: `${latency}ms`,
          isJson,
          contentType,
          data: data ? JSON.stringify(data, null, 2) : null,
          text: !data ? responseText : null
        }
      }))
    } catch (e) {
      setApiResponses(prev => ({
        ...prev,
        [description]: {
          endpoint,
          error: e instanceof Error ? e.message : String(e)
        }
      }))
    } finally {
      setLoading(false)
    }
  }
  
  const runAllTests = () => {
    setLoading(true)
    setApiResponses({})
    
    // Chain the promises to run tests sequentially
    testApi('/api/proxy?endpoint=posts.json&limit=1&tags=safe', 'API Proxy Route')
      .then(() => testApi('https://e621.net/posts.json?limit=1&tags=safe', 'Direct API (CORS test)'))
  }
  
  return (
    <div className="bg-gray-900 border border-gray-700 rounded p-4 mb-6">
      <h3 className="text-lg font-medium text-white mb-4">API Debug Tool</h3>
      
      <div className="space-y-2 mb-4">
        <h4 className="text-sm font-medium text-gray-300">API Path Discovery:</h4>
        {apiRootItems.length === 0 ? (
          <p className="text-gray-400 text-sm">Checking API paths...</p>
        ) : (
          <ul className="text-sm text-gray-400 space-y-1">
            {apiRootItems.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="mb-4">
        <Button 
          onClick={runAllTests} 
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500"
        >
          {loading ? 'Testing...' : 'Run API Tests'}
        </Button>
      </div>
      
      {Object.entries(apiResponses).length > 0 && (
        <div className="space-y-4">
          {Object.entries(apiResponses).map(([name, result]) => (
            <div key={name} className="border border-gray-800 rounded p-3">
              <h4 className="font-medium text-white mb-1">{name}</h4>
              <p className="text-xs text-gray-400 mb-2">{result.endpoint}</p>
              
              {result.error ? (
                <div className="bg-red-900/30 p-2 rounded text-red-300 text-sm">
                  Error: {result.error}
                </div>
              ) : (
                <div>
                  <div className="flex items-center space-x-4 mb-2">
                    <span className={`text-sm ${result.status?.includes('200') ? 'text-green-400' : 'text-red-400'}`}>
                      Status: {result.status}
                    </span>
                    {result.latency && (
                      <span className="text-sm text-gray-400">
                        Latency: {result.latency}
                      </span>
                    )}
                    {result.contentType && (
                      <span className="text-sm text-gray-400">
                        Type: {result.contentType}
                      </span>
                    )}
                  </div>
                  
                  {result.data ? (
                    <pre className="text-xs bg-gray-800 p-2 rounded text-green-300 overflow-auto max-h-60">
                      {result.data}
                    </pre>
                  ) : result.text ? (
                    <pre className="text-xs bg-gray-800 p-2 rounded text-gray-300 overflow-auto max-h-60">
                      {result.text.length > 500 ? result.text.substring(0, 500) + '...' : result.text}
                    </pre>
                  ) : (
                    <p className="text-sm text-gray-400">No response data</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-800">
        <h4 className="font-medium text-white mb-2">API Status</h4>
        <div className="grid grid-cols-3 gap-2">
          <Button 
            onClick={() => testApi('/api/ping', 'API Ping')} 
            size="sm"
            disabled={loading}
            className="bg-green-800 hover:bg-green-700 text-sm"
          >
            Test API Ping
          </Button>
          <Button 
            onClick={() => testApi('/api/proxy?endpoint=posts.json&limit=1&tags=safe', 'Simple Proxy Test')} 
            size="sm"
            disabled={loading}
            className="bg-blue-800 hover:bg-blue-700 text-sm"
          >
            Test Proxy API
          </Button>
          <Button 
            onClick={() => testApi('/api/proxy?nonexistent=true', 'Bad Proxy Request')} 
            size="sm"
            disabled={loading}
            className="bg-orange-800 hover:bg-orange-700 text-sm"
          >
            Test Bad Request
          </Button>
        </div>
      </div>
    </div>
  )
}