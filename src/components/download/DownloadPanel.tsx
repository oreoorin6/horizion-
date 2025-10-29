'use client';

import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Progress } from '../../components/ui/progress';
import { X, Download, Pause, Play, Trash2, Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
import { useDownloadManager } from '../../lib/download-manager';
import { DownloadItem, DownloadStatus } from '../../lib/download-manager/types';
import { formatBytes } from '../../lib/utils';

export default function DownloadPanel() {
  const {
    state,
    toggleDownloadPanel,
    pauseDownload,
    resumeDownload,
    removeDownload,
    pauseAllDownloads,
    resumeAllDownloads,
    clearCompletedDownloads,
    clearQueue
  } = useDownloadManager();
  
  const { downloads, isDownloadPanelOpen, activeDownloads } = state;
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'settings'>('active');
  
  if (!isDownloadPanelOpen) return null;
  
  const activeDownloadItems = downloads.filter(
    download => ['downloading', 'queued', 'paused'].includes(download.status)
  );
  
  const completedDownloadItems = downloads.filter(
    download => ['completed', 'error'].includes(download.status)
  );
  
  return (
    <div className="fixed bottom-0 right-0 w-96 max-h-[70vh] bg-background border border-accent rounded-tl-lg shadow-lg flex flex-col z-50">
      <div className="flex justify-between items-center p-3 border-b border-accent">
        <div className="text-lg font-bold flex items-center gap-2">
          <Download size={18} />
          Downloads
          {activeDownloads > 0 && (
            <span className="text-sm font-normal text-muted-foreground">
              ({activeDownloads} active)
            </span>
          )}
        </div>
        <Button variant="ghost" size="icon" onClick={toggleDownloadPanel}>
          <X size={18} />
        </Button>
      </div>
      
      <div className="flex border-b border-accent">
        <button
          className={`flex-1 p-2 text-center ${activeTab === 'active' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Active ({activeDownloadItems.length})
        </button>
        <button
          className={`flex-1 p-2 text-center ${activeTab === 'completed' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed ({completedDownloadItems.length})
        </button>
        <button
          className={`flex-1 p-2 text-center ${activeTab === 'settings' ? 'border-b-2 border-primary' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          Settings
        </button>
      </div>
      
      {activeTab === 'active' && (
        <>
          <div className="overflow-y-auto flex-grow">
            {activeDownloadItems.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No active downloads
              </div>
            ) : (
              <div className="p-2">
                {activeDownloadItems.map(download => (
                  <DownloadListItem
                    key={download.id}
                    download={download}
                    onPause={() => pauseDownload(download.id)}
                    onResume={() => resumeDownload(download.id)}
                    onRemove={() => removeDownload(download.id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {activeDownloadItems.length > 0 && (
            <div className="p-3 border-t border-accent flex justify-between">
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={activeDownloads > 0 ? pauseAllDownloads : resumeAllDownloads}
                >
                  {activeDownloads > 0 ? 'Pause All' : 'Resume All'}
                </Button>
              </div>
              <div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearQueue}
                >
                  Clear Queue
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      
      {activeTab === 'completed' && (
        <>
          <div className="overflow-y-auto flex-grow">
            {completedDownloadItems.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                No completed downloads
              </div>
            ) : (
              <div className="p-2">
                {completedDownloadItems.map(download => (
                  <CompletedDownloadListItem
                    key={download.id}
                    download={download}
                    onRemove={() => removeDownload(download.id)}
                  />
                ))}
              </div>
            )}
          </div>
          
          {completedDownloadItems.length > 0 && (
            <div className="p-3 border-t border-accent flex justify-end">
              <Button
                variant="outline"
                size="sm"
                onClick={clearCompletedDownloads}
              >
                Clear Completed
              </Button>
            </div>
          )}
        </>
      )}
      
      {activeTab === 'settings' && (
        <DownloadSettingsPanel />
      )}
    </div>
  );
}

// Individual download item component
function DownloadListItem({ 
  download, 
  onPause, 
  onResume, 
  onRemove 
}: {
  download: DownloadItem;
  onPause: () => void;
  onResume: () => void;
  onRemove: () => void;
}) {
  const statusIcons: Record<DownloadStatus, JSX.Element> = {
    downloading: <Download size={16} className="text-primary" />,
    queued: <Clock size={16} className="text-muted-foreground" />,
    paused: <Pause size={16} className="text-yellow-500" />,
    completed: <CheckCircle size={16} className="text-green-500" />,
    error: <XCircle size={16} className="text-red-500" />
  };
  
  return (
    <div className="mb-3 p-2 border border-accent rounded-md bg-accent/5">
      <div className="flex justify-between items-center mb-1">
        <div className="flex items-center gap-1 truncate pr-2">
          {statusIcons[download.status]}
          <span className="text-sm font-medium truncate">
            {download.filename}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {download.status === 'downloading' && (
            <Button variant="ghost" size="icon" onClick={onPause} className="h-6 w-6">
              <Pause size={14} />
            </Button>
          )}
          {download.status === 'paused' && (
            <Button variant="ghost" size="icon" onClick={onResume} className="h-6 w-6">
              <Play size={14} />
            </Button>
          )}
          <Button variant="ghost" size="icon" onClick={onRemove} className="h-6 w-6">
            <Trash2 size={14} />
          </Button>
        </div>
      </div>
      
      <div className="mb-1">
        <Progress value={download.progress} className="h-2" />
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <div>
          {download.status === 'downloading' && (
            <>
              {formatBytes(download.downloaded)} / {formatBytes(download.size)}
              <span className="ml-1">
                ({download.progress.toFixed(1)}%)
              </span>
            </>
          )}
          {download.status === 'queued' && 'Queued'}
          {download.status === 'paused' && 'Paused'}
          {download.status === 'error' && download.error}
        </div>
        {download.status === 'downloading' && download.speed > 0 && (
          <div>{download.speed.toFixed(1)} MB/s</div>
        )}
      </div>
    </div>
  );
}

// Completed download item component
function CompletedDownloadListItem({ 
  download, 
  onRemove 
}: {
  download: DownloadItem;
  onRemove: () => void;
}) {
  return (
    <div className="mb-3 p-2 border border-accent rounded-md bg-accent/5">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-1 truncate pr-2">
          {download.status === 'completed' ? (
            <CheckCircle size={16} className="text-green-500" />
          ) : (
            <XCircle size={16} className="text-red-500" />
          )}
          <span className="text-sm font-medium truncate">
            {download.filename}
          </span>
        </div>
        <Button variant="ghost" size="icon" onClick={onRemove} className="h-6 w-6">
          <Trash2 size={14} />
        </Button>
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground mt-1">
        <div>
          {download.status === 'completed' ? 'Completed' : 'Failed'}
          {download.completedAt && (
            <span className="ml-1">
              {new Date(download.completedAt).toLocaleString()}
            </span>
          )}
        </div>
        <div>{formatBytes(download.size)}</div>
      </div>
    </div>
  );
}

// Settings panel component
function DownloadSettingsPanel() {
  const { state, updateSettings } = useDownloadManager();
  const { settings } = state;
  const [localSettings, setLocalSettings] = useState(settings);
  
  const chooseFolder = async () => {
    try {
      const api = (typeof window !== 'undefined' && (window as any).e621?.dialog) as any
      const folder = await api?.chooseFolder?.()
      if (folder) {
        setLocalSettings(prev => ({ ...prev, location: folder }))
      }
    } catch (e) {
      console.error('Folder selection failed', e)
    }
  }
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setLocalSettings(prev => ({
        ...prev,
        [name]: checked
      }));
    } else if (type === 'number') {
      setLocalSettings(prev => ({
        ...prev,
        [name]: Number(value)
      }));
    } else {
      setLocalSettings(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };
  
  const handleSave = () => {
    updateSettings(localSettings);
  };
  
  return (
    <div className="p-4 overflow-y-auto flex-grow">
      <h3 className="text-lg font-medium mb-4">Download Settings</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium">Default Quality</label>
          <select
            name="quality"
            value={localSettings.quality}
            onChange={handleChange}
            className="w-full p-2 border border-accent rounded bg-background"
          >
            <option value="original">Original</option>
            <option value="sample">Sample</option>
            <option value="preview">Preview</option>
          </select>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Download Location</label>
          <div className="flex gap-2">
            <input
              type="text"
              name="location"
              value={localSettings.location}
              onChange={handleChange}
              className="flex-1 p-2 border border-accent rounded bg-background"
              placeholder="downloads"
            />
            <Button variant="outline" size="sm" onClick={chooseFolder}>Browse…</Button>
          </div>
          <p className="text-xs text-muted-foreground">Absolute paths save directly; relative paths are placed under your system Downloads.</p>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Filename Template</label>
          <input
            type="text"
            name="filenameTemplate"
            value={localSettings.filenameTemplate}
            onChange={handleChange}
            className="w-full p-2 border border-accent rounded bg-background"
            placeholder="{artist}_{id}.{ext}"
          />
          <p className="text-xs text-muted-foreground">
            Available variables: {'{id}'}, {'{artist}'}, {'{character}'}, {'{rating}'}, {'{score}'}, {'{ext}'}, {'{md5}'}, {'{date}'}, {'{year}'}, {'{month}'}, {'{day}'}
          </p>
        </div>
        
        <div className="space-y-2">
          <label className="block text-sm font-medium">Max Concurrent Downloads</label>
          <input
            type="number"
            name="maxConcurrentDownloads"
            value={localSettings.maxConcurrentDownloads}
            onChange={handleChange}
            min={1}
            max={10}
            className="w-full p-2 border border-accent rounded bg-background"
          />
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="showNotifications"
            name="showNotifications"
            checked={localSettings.showNotifications}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="showNotifications" className="text-sm">
            Show notifications for completed downloads
          </label>
        </div>
        
        <div className="flex items-center">
          <input
            type="checkbox"
            id="createSubfolders"
            name="createSubfolders"
            checked={localSettings.createSubfolders}
            onChange={handleChange}
            className="mr-2"
          />
          <label htmlFor="createSubfolders" className="text-sm">
            Create subfolders for downloads
          </label>
        </div>
        
        {localSettings.createSubfolders && (
          <div className="space-y-2 pl-6">
            <label className="block text-sm font-medium">Subfolder Template</label>
            <input
              type="text"
              name="subfolderTemplate"
              value={localSettings.subfolderTemplate}
              onChange={handleChange}
              className="w-full p-2 border border-accent rounded bg-background"
              placeholder="{artist}"
            />
          </div>
        )}
        
        <div className="pt-4">
          <Button onClick={handleSave}>Save Settings</Button>
        </div>
      </div>
    </div>
  );
}