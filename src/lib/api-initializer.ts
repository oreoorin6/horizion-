'use client'

import { useEffect, useState } from 'react'
import { IApiClient } from './api/IApiClient';

type ApiStatus = 'loading' | 'ready' | 'error';

// A singleton to track API initialization status across the app
class ApiInitializer {
  private static instance: ApiInitializer;
  private status: ApiStatus = 'loading';
  private e621api: IApiClient | null = null;
  private error: Error | null = null;
  private listeners: Array<(status: ApiStatus, api: IApiClient | null, error: Error | null) => void> = [];

  private constructor() {
    this.initApi();
  }

  public static getInstance(): ApiInitializer {
    if (!ApiInitializer.instance) {
      ApiInitializer.instance = new ApiInitializer();
    }
    return ApiInitializer.instance;
  }

  private async initApi(): Promise<void> {
    try {
      // Dynamically import the API module to avoid SSR issues
      const apiModule = await import('./api/e621');
      this.e621api = apiModule.e621api;
      
      if (!this.e621api) {
        throw new Error('API client not initialized properly');
      }
      
      console.log('[ApiInitializer] E621 API client loaded successfully');
      this.status = 'ready';
      this.notifyListeners();
    } catch (error) {
      console.error('[ApiInitializer] Failed to initialize API client:', error);
      this.error = error instanceof Error ? error : new Error(String(error));
      this.status = 'error';
      this.notifyListeners();
    }
  }

  public getApi(): IApiClient | null {
    return this.e621api;
  }

  public getStatus(): ApiStatus {
    return this.status;
  }

  public getError(): Error | null {
    return this.error;
  }

  public addListener(listener: (status: ApiStatus, api: IApiClient | null, error: Error | null) => void): () => void {
    this.listeners.push(listener);
    
    // Immediately notify with current status
    listener(this.status, this.e621api, this.error);
    
    // Return a function to remove the listener
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => {
      listener(this.status, this.e621api, this.error);
    });
  }
}

// Hook to access the API
export function useE621Api(): {
  api: IApiClient | null;
  status: ApiStatus;
  error: Error | null;
} {
  const [apiState, setApiState] = useState<{
    api: IApiClient | null;
    status: ApiStatus;
    error: Error | null;
  }>({
    api: null,
    status: 'loading',
    error: null
  });

  useEffect(() => {
    // Only run in the browser
    if (typeof window === 'undefined') {
      return;
    }

    const apiInitializer = ApiInitializer.getInstance();
    
    // Subscribe to API status changes
    const unsubscribe = apiInitializer.addListener((status, api, error) => {
      setApiState({
        api,
        status,
        error
      });
    });
    
    return unsubscribe;
  }, []);

  return apiState;
}

// Export the singleton instance for direct access
export const apiInitializer = typeof window !== 'undefined' ? ApiInitializer.getInstance() : null;