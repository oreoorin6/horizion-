'use client';

import { useState } from 'react';

interface DebugConsoleProps {
  title?: string;
  className?: string;
}

export const DebugConsole: React.FC<DebugConsoleProps> = ({
  title = 'Debug Console',
  className = '',
}) => {
  const [logs, setLogs] = useState<Array<{message: string, type: string}>>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  // Intercept console logs when enabled
  const startCapturing = () => {
    const originalConsoleLog = console.log;
    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.log = (...args) => {
      originalConsoleLog(...args);
      setLogs(prev => [...prev, { 
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '), 
        type: 'log' 
      }]);
    };
    
    console.error = (...args) => {
      originalConsoleError(...args);
      setLogs(prev => [...prev, { 
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '), 
        type: 'error' 
      }]);
    };
    
    console.warn = (...args) => {
      originalConsoleWarn(...args);
      setLogs(prev => [...prev, { 
        message: args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
        ).join(' '), 
        type: 'warning' 
      }]);
    };

    setIsExpanded(true);
    
    return () => {
      console.log = originalConsoleLog;
      console.error = originalConsoleError;
      console.warn = originalConsoleWarn;
    };
  };

  const stopCapturing = () => {
    console.log = window.console.log;
    console.error = window.console.error;
    console.warn = window.console.warn;
  };

  const clearLogs = () => {
    setLogs([]);
  };

  // Log test API request
  const testApiRequest = async () => {
    try {
      console.log('Testing API request to e621.net...');
      const response = await fetch('https://e621.net/posts.json?limit=2&tags=safe', {
        headers: {
          'User-Agent': 'E621HorizonTest/1.0',
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('API response:', data);
      
      if (data && data.posts) {
        console.log(`Received ${data.posts.length} posts`);
        if (data.posts.length > 0) {
          console.log('First post ID:', data.posts[0].id);
        }
      } else {
        console.error('Invalid response format, missing posts array');
      }
    } catch (error) {
      console.error('API test failed:', error);
    }
  };

  return (
    <div className={`fixed bottom-0 right-0 z-50 bg-gray-900 border border-gray-700 ${className}`}
         style={{ width: isExpanded ? '600px' : '200px', maxHeight: '80vh' }}>
      <div className="bg-gray-800 p-2 flex justify-between items-center cursor-pointer"
           onClick={() => setIsExpanded(!isExpanded)}>
        <h3 className="text-white font-medium">{title}</h3>
        <div className="flex">
          <button onClick={(e) => {
            e.stopPropagation();
            if (isExpanded) {
              stopCapturing();
              setIsExpanded(false);
            } else {
              startCapturing();
            }
          }} className="px-2 py-1 bg-blue-600 text-xs text-white rounded mr-1">
            {isExpanded ? 'Stop' : 'Start'}
          </button>
          <button onClick={(e) => {
            e.stopPropagation();
            clearLogs();
          }} className="px-2 py-1 bg-gray-600 text-xs text-white rounded mr-1">
            Clear
          </button>
          <button onClick={(e) => {
            e.stopPropagation();
            testApiRequest();
          }} className="px-2 py-1 bg-green-600 text-xs text-white rounded">
            Test API
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-gray-900 p-2 overflow-auto" style={{ maxHeight: 'calc(80vh - 40px)' }}>
          {logs.length === 0 ? (
            <p className="text-gray-400 text-sm">No logs captured yet...</p>
          ) : (
            <div className="font-mono text-xs">
              {logs.map((log, index) => (
                <div key={index} className={`mb-1 p-1 ${
                  log.type === 'error' ? 'bg-red-900/50 text-red-300' : 
                  log.type === 'warning' ? 'bg-yellow-900/50 text-yellow-300' : 
                  'text-gray-300'
                }`}>
                  <pre className="whitespace-pre-wrap">{log.message}</pre>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DebugConsole;