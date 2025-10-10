'use client';

import React from 'react';
import { Button } from '../../components/ui/button';
import { Download, CheckSquare } from 'lucide-react';
import { useDownloadManager } from '../../lib/download-manager';

interface MassDownloadButtonProps {
  onStartSelection: () => void;
}

export default function MassDownloadButton({ onStartSelection }: MassDownloadButtonProps) {
  const { state } = useDownloadManager();
  const isSelectionActive = state.selection.active;
  
  return (
    <Button
      variant={isSelectionActive ? 'secondary' : 'outline'}
      onClick={onStartSelection}
      className="gap-1"
    >
      {isSelectionActive ? (
        <>
          <CheckSquare size={16} />
          <span>Selecting...</span>
        </>
      ) : (
        <>
          <Download size={16} />
          <span>Mass Download</span>
        </>
      )}
    </Button>
  );
}