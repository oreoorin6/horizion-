'use client';

import { useState, useEffect, useRef } from 'react';
import { useDeveloperSettings } from '@/hooks/useDeveloperSettings';

interface LogEntry {
  id: number;
  message: string;
  type: 'log' | 'error' | 'warning' | 'api';
  timestamp: Date;
}

interface DebugConsoleProps {
  title?: string;
  className?: string;
}

export const DebugConsole: React.FC<DebugConsoleProps> = ({
  title = 'Debug Console',
  className = '',
}) => {
  const { settings, updateSettings } = useDeveloperSettings();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const logIdCounter = useRef(0);
  const originalConsole = useRef<{
    log: typeof console.log;
    error: typeof console.error;
    warn: typeof console.warn;
  } | null>(null);

  // Don't render if debug console is disabled
  if (!settings.debugConsoleEnabled) {
    return null;
  }

  // Function to add log entry
  const addLogEntry = (message: string, type: LogEntry['type']) => {
    const entry: LogEntry = {
      id: ++logIdCounter.current,
      message,
      type,
      timestamp: new Date()
    };

    setLogs(prev => {
      const newLogs = [...prev, entry];
      // Limit log entries based on settings
      if (newLogs.length > settings.maxLogEntries) {
        return newLogs.slice(-settings.maxLogEntries);
      }
      return newLogs;
    });
  };

  // Intercept console logs when enabled
  const startCapturing = () => {
    if (isCapturing) return;

    // Store original console methods
    originalConsole.current = {
      log: console.log,
      error: console.error,
      warn: console.warn
    };

    console.log = (...args) => {
      originalConsole.current!.log(...args);
      if (settings.showDebugLogs) {
        // Use setTimeout to defer state update and avoid render-time updates
        setTimeout(() => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          
          // Detect API-related logs
          const isApiLog = message.includes('[E621API]') || 
                          message.includes('API') || 
                          message.includes('fetch') ||
                          message.toLowerCase().includes('request');
          
          if (isApiLog && settings.showApiLogs) {
            addLogEntry(message, 'api');
          } else if (!isApiLog) {
            addLogEntry(message, 'log');
          }
        }, 0);
      }
    };
    
    console.error = (...args) => {
      originalConsole.current!.error(...args);
      if (settings.showErrorLogs) {
        setTimeout(() => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          addLogEntry(message, 'error');
        }, 0);
      }
    };
    
    console.warn = (...args) => {
      originalConsole.current!.warn(...args);
      if (settings.showWarningLogs) {
        setTimeout(() => {
          const message = args.map(arg => 
            typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
          ).join(' ');
          addLogEntry(message, 'warning');
        }, 0);
      }
    };

    setIsCapturing(true);
    setIsExpanded(true);
  };

  const stopCapturing = () => {
    if (!isCapturing || !originalConsole.current) return;

    console.log = originalConsole.current.log;
    console.error = originalConsole.current.error;
    console.warn = originalConsole.current.warn;
    
    setIsCapturing(false);
  };

  // Load persisted logs on mount
  useEffect(() => {
    if (settings.persistLogs && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('e621-debug-logs');
        if (stored) {
          const parsedLogs = JSON.parse(stored);
          setLogs(parsedLogs.map((log: any) => ({
            ...log,
            timestamp: new Date(log.timestamp)
          })));
        }
      } catch (error) {
        console.error('Failed to load persisted debug logs:', error);
      }
    }
  }, [settings.persistLogs]);

  // Persist logs when they change
  useEffect(() => {
    if (settings.persistLogs && logs.length > 0 && typeof window !== 'undefined') {
      try {
        localStorage.setItem('e621-debug-logs', JSON.stringify(logs));
      } catch (error) {
        console.error('Failed to persist debug logs:', error);
      }
    }
  }, [logs, settings.persistLogs]);

  // Auto-start capturing if enabled
  useEffect(() => {
    if (settings.debugConsoleEnabled && !isCapturing) {
      startCapturing();
    }
    
    // Cleanup on unmount
    return () => {
      if (isCapturing) {
        stopCapturing();
      }
    };
  }, [settings.debugConsoleEnabled]);

  const clearLogs = () => {
    setLogs([]);
    if (settings.persistLogs && typeof window !== 'undefined') {
      localStorage.removeItem('e621-debug-logs');
    }
  };

  // Filter logs based on settings
  const filteredLogs = logs.filter(log => {
    switch (log.type) {
      case 'log':
        return settings.showDebugLogs;
      case 'error':
        return settings.showErrorLogs;
      case 'warning':
        return settings.showWarningLogs;
      case 'api':
        return settings.showApiLogs;
      default:
        return true;
    }
  });

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
            if (isCapturing) {
              stopCapturing();
            } else {
              startCapturing();
            }
          }} className={`px-2 py-1 text-xs text-white rounded mr-1 ${
            isCapturing ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}>
            {isCapturing ? 'Stop' : 'Start'}
          </button>
          <button onClick={(e) => {
            e.stopPropagation();
            clearLogs();
          }} className="px-2 py-1 bg-gray-600 hover:bg-gray-700 text-xs text-white rounded mr-1">
            Clear ({filteredLogs.length})
          </button>
          <button onClick={(e) => {
            e.stopPropagation();
            testApiRequest();
          }} className="px-2 py-1 bg-green-600 hover:bg-green-700 text-xs text-white rounded">
            Test API
          </button>
        </div>
      </div>
      
      {isExpanded && (
        <div className="bg-gray-900 p-2 overflow-auto" style={{ maxHeight: 'calc(80vh - 40px)' }}>
          {filteredLogs.length === 0 ? (
            <p className="text-gray-400 text-sm">
              {logs.length === 0 
                ? "No logs captured yet..." 
                : "No logs match current filter settings..."
              }
            </p>
          ) : (
            <div className="font-mono text-xs">
              {filteredLogs.map((log) => (
                <div key={log.id} className={`mb-1 p-1 border-l-2 ${
                  log.type === 'error' ? 'bg-red-900/30 text-red-300 border-red-500' : 
                  log.type === 'warning' ? 'bg-yellow-900/30 text-yellow-300 border-yellow-500' : 
                  log.type === 'api' ? 'bg-blue-900/30 text-blue-300 border-blue-500' :
                  'text-gray-300 border-gray-500'
                }`}>
                  <div className="flex items-start gap-2">
                    <span className="text-gray-400 text-[10px] mt-0.5 min-w-[60px]">
                      {log.timestamp.toLocaleTimeString()}
                    </span>
                    <span className={`text-[10px] px-1 rounded min-w-[35px] text-center ${
                      log.type === 'error' ? 'bg-red-600' :
                      log.type === 'warning' ? 'bg-yellow-600' :
                      log.type === 'api' ? 'bg-blue-600' :
                      'bg-gray-600'
                    }`}>
                      {log.type.toUpperCase()}
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap mt-1 ml-16">{log.message}</pre>
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