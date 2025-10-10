'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApi } from './useApi';
import { IE621ApiClient, IFAApiClient } from '@/lib/api/IApiClient';
import { FACredentials } from '@/lib/api/furaffinity/types';

export interface E621AuthCredentials {
  username: string;
  apiKey: string;
}

export interface MultiAuthState {
  e621: {
    isAuthenticated: boolean;
    credentials: E621AuthCredentials | null;
  };
  fa: {
    isAuthenticated: boolean;
    credentials: FACredentials | null;
  };
  isLoading: boolean;
}

const E621_STORAGE_KEY = 'e621horizon_credentials';
const FA_STORAGE_KEY = 'fa_credentials';

function loadE621Credentials(): E621AuthCredentials | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(E621_STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    if (parsed.username && parsed.apiKey) {
      return {
        username: parsed.username,
        apiKey: parsed.apiKey
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

function loadFACredentials(): FACredentials | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(FA_STORAGE_KEY);
    if (!stored) return null;
    
    const parsed = JSON.parse(stored);
    
    if (parsed.cookie_a && parsed.cookie_b) {
      return {
        cookie_a: parsed.cookie_a,
        cookie_b: parsed.cookie_b
      };
    }
    
    return null;
  } catch {
    return null;
  }
}

function saveE621Credentials(credentials: E621AuthCredentials) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(E621_STORAGE_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Failed to save e621 credentials:', error);
  }
}

function saveFACredentials(credentials: FACredentials) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(FA_STORAGE_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Failed to save FA credentials:', error);
  }
}

function clearE621Credentials() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(E621_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear e621 credentials:', error);
  }
}

function clearFACredentials() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(FA_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear FA credentials:', error);
  }
}

export function useMultiAuth() {
  const [authState, setAuthState] = useState<MultiAuthState>({
    e621: {
      isAuthenticated: false,
      credentials: null
    },
    fa: {
      isAuthenticated: false,
      credentials: null
    },
    isLoading: true
  });

  const e621api = useApi<IE621ApiClient>('e621');
  const faapi = useApi<IFAApiClient>('furaffinity');

  useEffect(() => {
    const e621Credentials = loadE621Credentials();
    const faCredentials = loadFACredentials();
    
    // Set up e621 auth
    if (e621Credentials && e621api) {
      const auth = btoa(`${e621Credentials.username}:${e621Credentials.apiKey}`);
      e621api.setAuth({ 'Authorization': `Basic ${auth}` });
    }
    
    // Set up FA auth
    if (faCredentials && faapi) {
      const cookieString = `a=${faCredentials.cookie_a}; b=${faCredentials.cookie_b}`;
      faapi.setAuth({ 'Cookie': cookieString });
    }
    
    setAuthState({
      e621: {
        isAuthenticated: !!e621Credentials,
        credentials: e621Credentials
      },
      fa: {
        isAuthenticated: !!faCredentials,
        credentials: faCredentials
      },
      isLoading: false
    });
  }, [e621api, faapi]);

  const loginE621 = useCallback(async (username: string, apiKey: string): Promise<boolean> => {
    if (!e621api) return false;
    
    const credentials = { username, apiKey };
    const auth = btoa(`${username}:${apiKey}`);
    e621api.setAuth({ 'Authorization': `Basic ${auth}` });

    const isValid = await e621api.testCredentials();

    if (isValid) {
      saveE621Credentials(credentials);
      setAuthState(prev => ({
        ...prev,
        e621: {
          isAuthenticated: true,
          credentials
        }
      }));
      return true;
    } else {
      e621api.setAuth({});
      clearE621Credentials();
      setAuthState(prev => ({
        ...prev,
        e621: {
          isAuthenticated: false,
          credentials: null
        }
      }));
      return false;
    }
  }, [e621api]);

  const loginFA = useCallback(async (cookieA: string, cookieB: string): Promise<boolean> => {
    if (!faapi) return false;
    
    const credentials = { cookie_a: cookieA, cookie_b: cookieB };
    const cookieString = `a=${cookieA}; b=${cookieB}`;
    faapi.setAuth({ 'Cookie': cookieString });

    const isValid = await faapi.testCredentials();

    if (isValid) {
      saveFACredentials(credentials);
      setAuthState(prev => ({
        ...prev,
        fa: {
          isAuthenticated: true,
          credentials
        }
      }));
      return true;
    } else {
      faapi.setAuth({});
      clearFACredentials();
      setAuthState(prev => ({
        ...prev,
        fa: {
          isAuthenticated: false,
          credentials: null
        }
      }));
      return false;
    }
  }, [faapi]);

  const logoutE621 = useCallback(() => {
    clearE621Credentials();
    if (e621api) {
      e621api.setAuth({});
    }
    setAuthState(prev => ({
      ...prev,
      e621: {
        isAuthenticated: false,
        credentials: null
      }
    }));
  }, [e621api]);

  const logoutFA = useCallback(() => {
    clearFACredentials();
    if (faapi) {
      faapi.setAuth({});
    }
    setAuthState(prev => ({
      ...prev,
      fa: {
        isAuthenticated: false,
        credentials: null
      }
    }));
  }, [faapi]);

  const logoutAll = useCallback(() => {
    logoutE621();
    logoutFA();
  }, [logoutE621, logoutFA]);

  return {
    ...authState,
    loginE621,
    loginFA,
    logoutE621,
    logoutFA,
    logoutAll,
    // Legacy support for existing e621-only auth
    isAuthenticated: authState.e621.isAuthenticated,
    credentials: authState.e621.credentials,
    login: loginE621,
    logout: logoutE621
  };
}