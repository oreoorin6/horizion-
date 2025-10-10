import { E621Post } from '../../lib/api/e621/types';

export type DownloadQuality = 'original' | 'sample' | 'preview';
export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'error';

export interface DownloadSettings {
  quality: DownloadQuality;
  location: string;
  filenameTemplate: string;
  maxConcurrentDownloads: number;
  showNotifications: boolean;
  createSubfolders: boolean;
  subfolderTemplate: string;
}

export interface DownloadItem {
  id: string;
  postId: number;
  post: E621Post;
  filename: string;
  url: string;
  path: string;
  size: number;
  downloaded: number;
  progress: number;
  speed: number;
  status: DownloadStatus;
  error?: string;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  quality: DownloadQuality;
}

export interface SelectionState {
  active: boolean;
  selectedPosts: number[];
  lastSelected?: number;
}

export interface DownloadManagerState {
  downloads: DownloadItem[];
  activeDownloads: number;
  history: DownloadItem[];
  selection: SelectionState;
  settings: DownloadSettings;
  isDownloadPanelOpen: boolean;
}