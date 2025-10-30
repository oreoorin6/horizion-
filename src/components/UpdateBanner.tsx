"use client";

import { useEffect, useState } from "react";
import { useDeveloperSettings } from "@/hooks/useDeveloperSettings";

interface UpdateInfo {
  currentVersion: string;
  latestVersion: string;
  releaseName?: string;
  releaseUrl: string;
  assetUrl?: string | null;
}

export default function UpdateBanner() {
  const [info, setInfo] = useState<UpdateInfo | null>(null);
  const { settings: devSettings } = useDeveloperSettings();

  useEffect(() => {
    // Respect user setting: only check and subscribe when enabled
    if (!devSettings.updateChecksEnabled) {
      setInfo(null);
      return;
    }
    if (typeof window === "undefined") return;
    const api = (window as any).e621?.updater;
    if (!api) return;

    const off = api.onAvailable?.((data: UpdateInfo) => {
      setInfo(data);
    });

    // Fire a check on mount (no-op if disabled)
    api.checkNow?.().then((res: any) => {
      if (res?.enabled && res?.update) setInfo(res.update);
    }).catch(() => {});

    return () => { try { off && off(); } catch {} };
  }, [devSettings.updateChecksEnabled]);

  if (!info) return null;

  const onGetUpdate = () => {
    const url = info.assetUrl || info.releaseUrl;
    (window as any).e621?.updater?.openRelease?.(url);
  };

  return (
    <div className="w-full bg-amber-400/10 border-b border-amber-400/30 text-amber-200 px-4 py-2 flex items-center justify-between">
      <div className="text-sm">
        Update available: <span className="font-medium">v{info.latestVersion}</span> (current v{info.currentVersion})
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={onGetUpdate}
          className="px-3 py-1 rounded bg-amber-500/20 text-amber-100 hover:bg-amber-500/30 text-sm"
        >
          Get update
        </button>
      </div>
    </div>
  );
}
