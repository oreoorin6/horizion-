export {}

declare global {
  interface Window {
    e621?: {
      download?: {
        start?: (payload: { id: string; url: string; directory: string; filename: string; headers?: Record<string, string> }) => Promise<void> | void
        cancel?: (id: string) => Promise<void> | void
        onProgress?: (cb: (data: { id: string; downloaded: number; total: number; speed: number }) => void) => () => void
        onCompleted?: (cb: (data: { id: string; path?: string }) => void) => () => void
        onError?: (cb: (data: { id: string; message?: string }) => void) => () => void
        onCancelled?: (cb: (data: { id: string }) => void) => () => void
      }
      dialog?: {
        chooseFolder?: () => Promise<string | null>
      }
      updater?: {
        onAvailable?: (cb: (data: { currentVersion: string; latestVersion: string; releaseName?: string; releaseUrl: string; assetUrl?: string | null }) => void) => () => void
        checkNow?: () => Promise<{ enabled: boolean; update?: { currentVersion: string; latestVersion: string; releaseName?: string; releaseUrl: string; assetUrl?: string | null } | null; error?: string }>
        openRelease?: (url: string) => Promise<boolean>
      }
      system?: {
        getDefaultDownloadsPath?: () => Promise<string>
      }
    }
  }
}
