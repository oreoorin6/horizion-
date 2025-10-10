'use client'

import { useState, useEffect, useCallback } from 'react'
import { useApi } from './useApi';
import { IApiClient, IE621ApiClient } from '@/lib/api/IApiClient';

export interface E621Credentials {
  username: string;
  apiKey: string;
}

export interface AuthState {
  isAuthenticated: boolean;
  credentials: E621Credentials | null;
  isLoading: boolean;
}

const STORAGE_KEY = 'e621horizon_credentials';

function loadCredentials(): E621Credentials | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
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

function saveCredentials(credentials: E621Credentials) {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(credentials));
  } catch (error) {
    console.error('Failed to save credentials:', error);
  }
}

function clearCredentials() {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear credentials:', error);
  }
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    credentials: null,
    isLoading: true
  });
  const e621api = useApi<IE621ApiClient>('e621');

  useEffect(() => {
    const credentials = loadCredentials();
    if (credentials && e621api) {
      const auth = btoa(`${credentials.username}:${credentials.apiKey}`);
      e621api.setAuth({ 'Authorization': `Basic ${auth}` });
    }
    setAuthState({
      isAuthenticated: !!credentials,
      credentials,
      isLoading: false
    });
  }, [e621api]);

  const login = useCallback(async (username: string, apiKey: string): Promise<boolean> => {
    if (!e621api) return false;
    const credentials = { username, apiKey };
    const auth = btoa(`${username}:${apiKey}`);
    e621api.setAuth({ 'Authorization': `Basic ${auth}` });

    const isValid = await e621api.testCredentials();

    if (isValid) {
      saveCredentials(credentials);
      setAuthState({
        isAuthenticated: true,
        credentials,
        isLoading: false
      });
      return true;
    } else {
      e621api.setAuth({}); // Clear auth on failure
      clearCredentials();
      setAuthState({
        isAuthenticated: false,
        credentials: null,
        isLoading: false
      });
      return false;
    }
  }, [e621api]);

  const logout = useCallback(() => {
    clearCredentials();
    if (e621api) {
      e621api.setAuth({});
    }
    setAuthState({
      isAuthenticated: false,
      credentials: null,
      isLoading: false
    });
  }, [e621api]);

  return {
    ...authState,
    login,
    logout,
  };
}