// src/components/chatroom/session/tabs/OverviewTab.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VideoTile from '../VideoTile';
import { Video } from 'lucide-react';
import type { ActiveSession, SafeUser } from '@/types';

interface OverviewTabProps {
  activeSession: ActiveSession;
  user: SafeUser | null;
}

export default function OverviewTab({ activeSession, user }: OverviewTabProps) {
  const onlineCount = activeSession.participants.filter(p => p.isOnline).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Participants ({onlineCount} connectés)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {activeSession.participants.map((participant) => (
            <VideoTile
              key={participant.id}
              name={participant.id === user?.id ? `${participant.name} (Vous)`: participant.name}
              isOnline={participant.isOnline}
              isTeacher={participant.role === 'teacher' || participant.role === 'admin'}
              hasRaisedHand={participant.hasRaisedHand}
              points={participant.points}
              badgeCount={participant.badges?.length}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
