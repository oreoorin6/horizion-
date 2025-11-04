'use client';

import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { E621Post } from '../../lib/api/e621/types';
import {
  DownloadManagerState,
  DownloadItem,
  DownloadQuality,
  DownloadStatus,
  DownloadSettings,
  SelectionState
} from './types';

// Define default settings (location will be updated when component mounts)
const defaultSettings: DownloadSettings = {
  quality: 'original',
  location: 'downloads', // Will be replaced with actual Windows Downloads path
  filenameTemplate: '{artist}_{id}.{ext}',
  maxConcurrentDownloads: 3,
  showNotifications: true,
  createSubfolders: false,
  subfolderTemplate: '{artist}'
};

// Define initial state
const initialState: DownloadManagerState = {
  downloads: [],
  activeDownloads: 0,
  history: [],
  selection: {
    active: false,
    selectedPosts: [],
  },
  settings: defaultSettings,
  isDownloadPanelOpen: false
};

// Action types
type Action =
  | { type: 'TOGGLE_SELECTION_MODE' }
  | { type: 'SELECT_POST', payload: number }
  | { type: 'DESELECT_POST', payload: number }
  | { type: 'SELECT_ALL', payload: number[] }
  | { type: 'DESELECT_ALL' }
  | { type: 'INVERT_SELECTION', payload: number[] }
  | { type: 'ADD_DOWNLOAD', payload: DownloadItem }
  | { type: 'ADD_MULTIPLE_DOWNLOADS', payload: DownloadItem[] }
  | { type: 'UPDATE_DOWNLOAD', payload: { id: string, changes: Partial<DownloadItem> } }
  | { type: 'REMOVE_DOWNLOAD', payload: string }
  | { type: 'CLEAR_COMPLETED' }
  | { type: 'CLEAR_QUEUE' }
  | { type: 'PAUSE_DOWNLOAD', payload: string }
  | { type: 'RESUME_DOWNLOAD', payload: string }
  | { type: 'PAUSE_ALL' }
  | { type: 'RESUME_ALL' }
  | { type: 'UPDATE_SETTINGS', payload: Partial<DownloadSettings> }
  | { type: 'TOGGLE_DOWNLOAD_PANEL' };

// Reducer function
function downloadManagerReducer(state: DownloadManagerState, action: Action): DownloadManagerState {
  switch (action.type) {
    case 'TOGGLE_SELECTION_MODE':
      return {
        ...state,
        selection: {
          ...state.selection,
          active: !state.selection.active,
          selectedPosts: !state.selection.active ? [] : state.selection.selectedPosts
        }
      };

    case 'SELECT_POST': {
      if (!state.selection.selectedPosts.includes(action.payload)) {
        return {
          ...state,
          selection: {
            ...state.selection,
            selectedPosts: [...state.selection.selectedPosts, action.payload],
            lastSelected: action.payload
          }
        };
      }
      return state;
    }

    case 'DESELECT_POST': {
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedPosts: state.selection.selectedPosts.filter(id => id !== action.payload)
        }
      };
    }

    case 'SELECT_ALL':
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedPosts: action.payload
        }
      };

    case 'DESELECT_ALL':
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedPosts: []
        }
      };

    case 'INVERT_SELECTION': {
      const allPostIds = action.payload;
      const selectedPostIds = state.selection.selectedPosts;
      const invertedSelection = allPostIds.filter(id => !selectedPostIds.includes(id));
      
      return {
        ...state,
        selection: {
          ...state.selection,
          selectedPosts: invertedSelection
        }
      };
    }

    case 'ADD_DOWNLOAD':
      return {
        ...state,
        downloads: [...state.downloads, action.payload],
        isDownloadPanelOpen: true,
        activeDownloads: state.activeDownloads + (action.payload.status === 'downloading' ? 1 : 0)
      };

    case 'ADD_MULTIPLE_DOWNLOADS':
      return {
        ...state,
        downloads: [...state.downloads, ...action.payload],
        isDownloadPanelOpen: true,
        activeDownloads: state.activeDownloads + action.payload.filter(d => d.status === 'downloading').length
      };

    case 'UPDATE_DOWNLOAD': {
      const { id, changes } = action.payload;
      const statusChanged = changes.status !== undefined;
      let activeChange = 0;
      
      if (statusChanged) {
        const download = state.downloads.find(d => d.id === id);
        if (download) {
          if (download.status !== 'downloading' && changes.status === 'downloading') {
            activeChange = 1;
          } else if (download.status === 'downloading' && changes.status !== 'downloading') {
            activeChange = -1;
          }
        }
      }
      
      const updatedDownloads = state.downloads.map(download =>
        download.id === id ? { ...download, ...changes } : download
      ) as DownloadItem[];
      
      const completedDownload = changes.status === 'completed' ? 
        updatedDownloads.find(d => d.id === id) : undefined;
      
      const updatedHistory = completedDownload ? 
        [...state.history, { ...completedDownload, completedAt: new Date() }] : 
        state.history;
      
      return {
        ...state,
        downloads: updatedDownloads,
        history: updatedHistory,
        activeDownloads: state.activeDownloads + activeChange
      };
    }

    case 'REMOVE_DOWNLOAD': {
      const download = state.downloads.find(d => d.id === action.payload);
      const activeChange = download?.status === 'downloading' ? -1 : 0;
      
      return {
        ...state,
        downloads: state.downloads.filter(download => download.id !== action.payload),
        activeDownloads: state.activeDownloads + activeChange
      };
    }

    case 'CLEAR_COMPLETED':
      return {
        ...state,
        downloads: state.downloads.filter(
          download => !['completed', 'error'].includes(download.status)
        )
      };

    case 'CLEAR_QUEUE':
      return {
        ...state,
        downloads: state.downloads.filter(
          download => !['queued'].includes(download.status)
        )
      };

    case 'PAUSE_DOWNLOAD': {
      const download = state.downloads.find(d => d.id === action.payload);
      const activeChange = download?.status === 'downloading' ? -1 : 0;
      
      return {
        ...state,
        downloads: state.downloads.map(download =>
          download.id === action.payload && download.status === 'downloading'
            ? { ...download, status: 'paused' as DownloadStatus }
            : download
        ),
        activeDownloads: state.activeDownloads + activeChange
      };
    }

    case 'RESUME_DOWNLOAD': {
      const canStart = state.activeDownloads < state.settings.maxConcurrentDownloads;
      const download = state.downloads.find(d => d.id === action.payload);
      
      if (!canStart || !download || download.status !== 'paused') {
        return state;
      }
      
      return {
        ...state,
        downloads: state.downloads.map(download =>
          download.id === action.payload && download.status === 'paused'
            ? { ...download, status: 'downloading' as DownloadStatus, startedAt: new Date() }
            : download
        ),
        activeDownloads: state.activeDownloads + 1
      };
    }

    case 'PAUSE_ALL':
      return {
        ...state,
        downloads: state.downloads.map(download =>
          download.status === 'downloading'
            ? { ...download, status: 'paused' as DownloadStatus }
            : download
        ),
        activeDownloads: 0
      };

    case 'RESUME_ALL': {
      let activeCount = 0;
      const updatedDownloads = state.downloads.map(download => {
        if (download.status === 'paused' && activeCount < state.settings.maxConcurrentDownloads) {
          activeCount++;
          return { ...download, status: 'downloading' as DownloadStatus, startedAt: new Date() };
        }
        return download;
      });
      
      return {
        ...state,
        downloads: updatedDownloads,
        activeDownloads: activeCount
      };
    }

    case 'UPDATE_SETTINGS':
      return {
        ...state,
        settings: {
          ...state.settings,
          ...action.payload
        }
      };

    case 'TOGGLE_DOWNLOAD_PANEL':
      return {
        ...state,
        isDownloadPanelOpen: !state.isDownloadPanelOpen
      };

    default:
      return state;
  }
}

// Create context
interface DownloadManagerContextValue {
  state: DownloadManagerState;
  toggleSelectionMode: () => void;
  selectPost: (postId: number) => void;
  deselectPost: (postId: number) => void;
  selectAllPosts: (postIds: number[]) => void;
  deselectAllPosts: () => void;
  invertSelection: (allPostIds: number[]) => void;
  downloadPost: (post: E621Post, quality?: DownloadQuality) => void;
  downloadSelectedPosts: (posts: E621Post[], quality?: DownloadQuality) => void;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  removeDownload: (id: string) => void;
  pauseAllDownloads: () => void;
  resumeAllDownloads: () => void;
  clearCompletedDownloads: () => void;
  clearQueue: () => void;
  updateSettings: (settings: Partial<DownloadSettings>) => void;
  toggleDownloadPanel: () => void;
  isPostSelected: (postId: number) => boolean;
}

const DownloadManagerContext = createContext<DownloadManagerContextValue | undefined>(undefined);

// Provider component
export function DownloadManagerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(downloadManagerReducer, initialState);
  
  // Initialize with proper Windows Downloads path and load settings from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const initializeSettings = async () => {
      try {
        // Get the actual Windows Downloads path
        const api = (window as any).e621?.system;
        let defaultDownloadsPath = 'downloads'; // fallback
        
        if (api && typeof api.getDefaultDownloadsPath === 'function') {
          try {
            defaultDownloadsPath = await api.getDefaultDownloadsPath();
          } catch (error) {
            console.warn('Failed to get system downloads path, using fallback:', error);
          }
        }
        
        // Load saved settings or apply defaults with proper downloads path
        const savedSettings = localStorage.getItem('e621-download-settings');
        if (savedSettings) {
          const parsed = JSON.parse(savedSettings);
          // If the saved location is still the old 'downloads' default, update it
          if (parsed.location === 'downloads') {
            parsed.location = defaultDownloadsPath;
          }
          dispatch({ 
            type: 'UPDATE_SETTINGS', 
            payload: parsed
          });
        } else {
          // First time setup - use proper downloads path
          dispatch({ 
            type: 'UPDATE_SETTINGS', 
            payload: { location: defaultDownloadsPath }
          });
        }
      } catch (error) {
        console.error('Failed to initialize download settings:', error);
      }
    };
    
    initializeSettings();
  }, []);
  
  // Save settings to localStorage when changed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('e621-download-settings', JSON.stringify(state.settings));
    } catch (error) {
      console.error('Failed to save download settings:', error);
    }
  }, [state.settings]);
  
  // Process download queue (Electron-backed)
  useEffect(() => {
    const { downloads, activeDownloads, settings } = state;
    if (activeDownloads >= settings.maxConcurrentDownloads) return;
    const queuedDownloads = downloads.filter(d => d.status === 'queued');
    if (queuedDownloads.length === 0) return;
    const availableSlots = settings.maxConcurrentDownloads - activeDownloads;
    const downloadsToStart = queuedDownloads.slice(0, availableSlots);

    downloadsToStart.forEach(download => {
      // Mark as downloading
      dispatch({
        type: 'UPDATE_DOWNLOAD',
        payload: {
          id: download.id,
          changes: { status: 'downloading' as DownloadStatus, startedAt: new Date() }
        }
      })

      // Ask Electron to start the download
      try {
        const api = (typeof window !== 'undefined' && (window as any).e621?.download) as any
        if (api && typeof api.start === 'function') {
          api.start({
            id: download.id,
            url: download.url,
            directory: download.path,
            filename: download.filename
          })
        } else {
          // Fallback: immediately complete to avoid stuck state
          dispatch({
            type: 'UPDATE_DOWNLOAD',
            payload: { id: download.id, changes: { progress: 100, status: 'completed' as DownloadStatus, completedAt: new Date() } }
          })
        }
      } catch (err) {
        console.error('Failed to start download', err)
        dispatch({
          type: 'UPDATE_DOWNLOAD',
          payload: { id: download.id, changes: { status: 'error' as DownloadStatus } }
        })
      }
    })
  }, [state.downloads, state.activeDownloads, state.settings.maxConcurrentDownloads]);

  // Wire Electron download events to state updates
  useEffect(() => {
    if (typeof window === 'undefined') return
    const api = (window as any).e621?.download
    if (!api) return

    const offProgress = api.onProgress?.((data: { id: string, downloaded: number, total: number, speed: number }) => {
      const { id, downloaded, total, speed } = data
      const progress = total > 0 ? Math.min(100, (downloaded / total) * 100) : undefined
      dispatch({
        type: 'UPDATE_DOWNLOAD',
        payload: {
          id,
          changes: {
            downloaded,
            size: total || undefined,
            progress: progress ?? undefined,
            speed: speed ?? 0
          }
        }
      })
    })

    const offCompleted = api.onCompleted?.((data: { id: string, path?: string }) => {
      dispatch({
        type: 'UPDATE_DOWNLOAD',
        payload: { id: data.id, changes: { progress: 100, status: 'completed' as DownloadStatus, completedAt: new Date() } }
      })
    })

    const offError = api.onError?.((data: { id: string, message?: string }) => {
      dispatch({
        type: 'UPDATE_DOWNLOAD',
        payload: { id: data.id, changes: { status: 'error' as DownloadStatus } }
      })
    })

    const offCancelled = api.onCancelled?.((data: { id: string }) => {
      dispatch({ type: 'PAUSE_DOWNLOAD', payload: data.id })
    })

    return () => {
      try { offProgress && offProgress() } catch {}
      try { offCompleted && offCompleted() } catch {}
      try { offError && offError() } catch {}
      try { offCancelled && offCancelled() } catch {}
    }
  }, [])
  
  // Generate a unique ID for downloads
  const generateDownloadId = useCallback(() => {
    return `dl_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }, []);
  
  // Memoize the action functions to prevent infinite re-renders
  const toggleSelectionMode = useCallback(() => dispatch({ type: 'TOGGLE_SELECTION_MODE' }), []);
  const selectPost = useCallback((postId: number) => dispatch({ type: 'SELECT_POST', payload: postId }), []);
  const deselectPost = useCallback((postId: number) => dispatch({ type: 'DESELECT_POST', payload: postId }), []);
  const selectAllPosts = useCallback((postIds: number[]) => dispatch({ type: 'SELECT_ALL', payload: postIds }), []);
  const deselectAllPosts = useCallback(() => dispatch({ type: 'DESELECT_ALL' }), []);
  const invertSelection = useCallback((allPostIds: number[]) => dispatch({ type: 'INVERT_SELECTION', payload: allPostIds }), []);
  
  // Memoize downloadPost function
  const downloadPost = useCallback((post: E621Post, quality?: DownloadQuality) => {
    const downloadQuality = quality || state.settings.quality;
    const id = generateDownloadId();
    
    // In a real implementation, we would determine the actual URL, size, etc. based on the quality
    let url = '';
    let size = 0;
    if (post.file) {
      if (downloadQuality === 'original') {
        url = post.file.url || '';
        size = post.file.size || 0;
      } else if (downloadQuality === 'sample' && post.sample) {
        url = post.sample.url || '';
        // Sample size not available in API, estimate it
        size = Math.floor((post.file.size || 0) * 0.5);
      } else if (post.preview) {
        url = post.preview.url || '';
        // Preview size not available in API, estimate it
        size = Math.floor((post.file.size || 0) * 0.1);
      }
    }
    
    const filename = generateFilename(post, state.settings.filenameTemplate);
    const path = generatePath(post, state.settings);
    
    const downloadItem: DownloadItem = {
      id,
      postId: post.id,
      post,
      filename,
      url,
      path,
      size,
      downloaded: 0,
      progress: 0,
      speed: 0,
      status: 'queued',
      createdAt: new Date(),
      quality: downloadQuality,
    };
    
    dispatch({ type: 'ADD_DOWNLOAD', payload: downloadItem });
  }, [state.settings.quality, generateDownloadId]);
  
  // Memoize downloadSelectedPosts function
  const downloadSelectedPosts = useCallback((posts: E621Post[], quality?: DownloadQuality) => {
    const selectedPostIds = state.selection.selectedPosts;
    const selectedPosts = posts.filter(post => selectedPostIds.includes(post.id));
    
    const downloadItems: DownloadItem[] = selectedPosts.map(post => {
      const downloadQuality = quality || state.settings.quality;
      const id = generateDownloadId();
      
      let url = '';
      let size = 0;
      if (post.file) {
        if (downloadQuality === 'original') {
          url = post.file.url || '';
          size = post.file.size || 0;
        } else if (downloadQuality === 'sample' && post.sample) {
          url = post.sample.url || '';
          // Sample size not available in API, estimate it
          size = Math.floor((post.file.size || 0) * 0.5);
        } else if (post.preview) {
          url = post.preview.url || '';
          // Preview size not available in API, estimate it
          size = Math.floor((post.file.size || 0) * 0.1);
        }
      }
      
      const filename = generateFilename(post, state.settings.filenameTemplate);
      const path = generatePath(post, state.settings);
      
      return {
        id,
        postId: post.id,
        post,
        filename,
        url,
        path,
        size,
        downloaded: 0,
        progress: 0,
        speed: 0,
        status: 'queued',
        createdAt: new Date(),
        quality: downloadQuality,
      };
    });
    
    dispatch({ type: 'ADD_MULTIPLE_DOWNLOADS', payload: downloadItems });
    
    // Optionally exit selection mode after downloading
    dispatch({ type: 'TOGGLE_SELECTION_MODE' });
  }, [state.selection.selectedPosts, state.settings.quality, generateDownloadId]);
  
  const pauseDownload = useCallback((id: string) => {
    try {
      const api = (typeof window !== 'undefined' && (window as any).e621?.download) as any
      if (api?.cancel) api.cancel(id)
    } catch {}
    dispatch({ type: 'PAUSE_DOWNLOAD', payload: id })
  }, [])
  
  const resumeDownload = useCallback((id: string) => dispatch({ type: 'RESUME_DOWNLOAD', payload: id }), []);
  
  const removeDownload = useCallback((id: string) => {
    try {
      const api = (typeof window !== 'undefined' && (window as any).e621?.download) as any
      if (api?.cancel) api.cancel(id)
    } catch {}
    dispatch({ type: 'REMOVE_DOWNLOAD', payload: id })
  }, [])
  
  const pauseAllDownloads = useCallback(() => {
    try {
      const api = (typeof window !== 'undefined' && (window as any).e621?.download) as any
      if (api?.cancel) {
        state.downloads.forEach(d => { if (d.status === 'downloading') api.cancel(d.id) })
      }
    } catch {}
    dispatch({ type: 'PAUSE_ALL' })
  }, [state.downloads])
  
  const resumeAllDownloads = useCallback(() => dispatch({ type: 'RESUME_ALL' }), []);
  const clearCompletedDownloads = useCallback(() => dispatch({ type: 'CLEAR_COMPLETED' }), []);
  const clearQueue = useCallback(() => dispatch({ type: 'CLEAR_QUEUE' }), []);
  const updateSettings = useCallback((settings: Partial<DownloadSettings>) => dispatch({ type: 'UPDATE_SETTINGS', payload: settings }), []);
  const toggleDownloadPanel = useCallback(() => dispatch({ type: 'TOGGLE_DOWNLOAD_PANEL' }), []);
  const isPostSelected = useCallback((postId: number) => state.selection.selectedPosts.includes(postId), [state.selection.selectedPosts]);
  
  // Create the context value object
  const value = useMemo(() => ({
    state,
    toggleSelectionMode,
    selectPost,
    deselectPost,
    selectAllPosts,
    deselectAllPosts,
    invertSelection,
    downloadPost,
    downloadSelectedPosts,
    pauseDownload,
    resumeDownload,
    removeDownload,
    pauseAllDownloads,
    resumeAllDownloads,
    clearCompletedDownloads,
    clearQueue,
    updateSettings,
    toggleDownloadPanel,
    isPostSelected,
  }), [
    state,
    toggleSelectionMode,
    selectPost,
    deselectPost,
    selectAllPosts,
    deselectAllPosts,
    invertSelection,
    downloadPost,
    downloadSelectedPosts,
    pauseDownload,
    resumeDownload,
    removeDownload,
    pauseAllDownloads,
    resumeAllDownloads,
    clearCompletedDownloads,
    clearQueue,
    updateSettings,
    toggleDownloadPanel,
    isPostSelected,
  ]);
  
  return (
    <DownloadManagerContext.Provider value={value}>
      {children}
    </DownloadManagerContext.Provider>
  );
}

// Helper functions for filename and path generation
function generateFilename(post: E621Post, template: string): string {
  let filename = template;
  
  // Replace variables in the template
  filename = filename.replace(/{id}/g, post.id.toString());
  
  // Artist replacement
  if (post.tags?.artist?.length) {
    filename = filename.replace(/{artist}/g, post.tags.artist[0]);
    filename = filename.replace(/{artist:first}/g, post.tags.artist[0]);
  } else {
    filename = filename.replace(/{artist}/g, 'unknown_artist');
    filename = filename.replace(/{artist:first}/g, 'unknown_artist');
  }
  
  // Character replacement
  if (post.tags?.character?.length) {
    filename = filename.replace(/{character}/g, post.tags.character.join('_'));
    filename = filename.replace(/{character:first}/g, post.tags.character[0]);
  } else {
    filename = filename.replace(/{character}/g, 'unknown_character');
    filename = filename.replace(/{character:first}/g, 'unknown_character');
  }
  
  // Rating replacement
  filename = filename.replace(/{rating}/g, post.rating);
  
  // Score replacement
  const score = post.score?.total || 0;
  filename = filename.replace(/{score}/g, score.toString());
  
  // Date components
  const uploadDate = post.created_at ? new Date(post.created_at) : new Date();
  const year = uploadDate.getFullYear().toString();
  const month = (uploadDate.getMonth() + 1).toString().padStart(2, '0');
  const day = uploadDate.getDate().toString().padStart(2, '0');
  
  filename = filename.replace(/{year}/g, year);
  filename = filename.replace(/{month}/g, month);
  filename = filename.replace(/{day}/g, day);
  filename = filename.replace(/{date}/g, `${year}${month}${day}`);
  
  // Extension
  const extension = post.file?.ext || 'jpg';
  filename = filename.replace(/{ext}/g, extension);
  
  // MD5
  filename = filename.replace(/{md5}/g, post.file?.md5 || '');
  
  // Sanitize filename (remove characters not allowed in filenames)
  filename = filename.replace(/[/\\?%*:|"<>]/g, '_');
  
  return filename;
}

function generatePath(post: E621Post, settings: DownloadSettings): string {
  let path = settings.location;
  
  if (settings.createSubfolders) {
    let subfolder = settings.subfolderTemplate;
    
    // Replace variables in the subfolder template (similar to filename generation)
    if (post.tags?.artist?.length) {
      subfolder = subfolder.replace(/{artist}/g, post.tags.artist[0]);
    } else {
      subfolder = subfolder.replace(/{artist}/g, 'unknown_artist');
    }
    
    // Sanitize subfolder name
    subfolder = subfolder.replace(/[/\\?%*:|"<>]/g, '_');
    
    path = `${path}/${subfolder}`;
  }
  
  return path;
}

// Custom hook to use the context
export function useDownloadManager() {
  const context = useContext(DownloadManagerContext);
  
  if (context === undefined) {
    throw new Error('useDownloadManager must be used within a DownloadManagerProvider');
  }
  
  return context;
}
