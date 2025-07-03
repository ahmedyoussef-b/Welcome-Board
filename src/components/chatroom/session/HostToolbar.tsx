// src/components/chatroom/session/HostToolbar.tsx
'use client';

import { Button } from '@/components/ui/button';
import { LayoutGrid, Monitor, Pencil } from 'lucide-react';

type ViewMode = 'grid' | 'screenShare' | 'whiteboard';

interface HostToolbarProps {
  viewMode: ViewMode;
  onSetViewMode: (mode: ViewMode) => void;
  onStartScreenShare: () => void;
}

export default function HostToolbar({ viewMode, onSetViewMode, onStartScreenShare }: HostToolbarProps) {

  const handleShareClick = () => {
    // Let the parent component handle the logic, which might include setting the view mode
    onStartScreenShare();
  };

  return (
    <div className="flex-shrink-0 flex items-center justify-center gap-2 p-2 mb-4 rounded-lg bg-card border shadow-sm">
      <Button
        variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onSetViewMode('grid')}
        className="flex items-center gap-2"
      >
        <LayoutGrid className="w-4 h-4" />
        Vue Grille
      </Button>
      <Button
        variant={viewMode === 'screenShare' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={handleShareClick}
        className="flex items-center gap-2"
      >
        <Monitor className="w-4 h-4" />
        Partager l'écran
      </Button>
      <Button
        variant={viewMode === 'whiteboard' ? 'secondary' : 'ghost'}
        size="sm"
        onClick={() => onSetViewMode('whiteboard')}
        className="flex items-center gap-2"
      >
        <Pencil className="w-4 h-4" />
        Tableau Blanc
      </Button>
    </div>
  );
}
