
// src/components/chatroom/session/SessionRoom.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Video, LogOut } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { updateStudentPresence, tickTimer } from '@/lib/redux/slices/sessionSlice';
import TimerDisplay from './TimerDisplay';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';

// Import session components
import OverviewTab from './tabs/OverviewTab';
import SessionSidebar from './SessionSidebar';
import ChatPanel from './ChatPanel';
import { ScrollArea } from '@/components/ui/scroll-area';


interface SessionRoomProps {
    onEndSession: () => void;
}

export default function SessionRoom({ onEndSession }: SessionRoomProps) {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);
  const user = useAppSelector(selectCurrentUser);

  // Simulate student presence updates
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      activeSession.participants.forEach(participant => {
        if (participant.role === 'admin') return; 
        const shouldUpdate = Math.random() < 0.1;
        if (shouldUpdate) {
          dispatch(updateStudentPresence({
            studentId: participant.id,
            isOnline: Math.random() > 0.2,
          }));
        }
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [activeSession, dispatch]);

  // Timer tick effect
  useEffect(() => {
    if (!activeSession?.classTimer?.isActive || activeSession.classTimer.remaining <= 0) {
      return;
    }

    const interval = setInterval(() => {
      dispatch(tickTimer());
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSession?.classTimer?.isActive, activeSession?.classTimer?.remaining, dispatch]);
  
  if (!activeSession || !user) {
    return <div>Chargement de la session...</div>;
  }

  const isHost = 
    (user?.role === 'TEACHER' && activeSession.sessionType === 'class') ||
    (user?.role === 'ADMIN' && activeSession.sessionType === 'meeting');

  const isParticipant = activeSession.participants.some(p => p.id === user?.id);

  if (!isHost && !isParticipant) {
      return <div>Accès non autorisé à cette session.</div>
  }

  return (
    <div className="h-screen flex flex-col">
      <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col gap-4 p-4 overflow-hidden">
              <div className="flex-shrink-0">
                   <OverviewTab activeSession={activeSession} user={user} />
              </div>
              <div className="flex-1 min-h-0">
                  <ChatPanel user={user} isHost={isHost} />
              </div>
          </main>
          
          <aside className="w-[400px] border-l bg-background p-4 flex flex-col gap-4">
             <div className="flex-shrink-0 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Video className="w-5 h-5 text-primary" />
                    <h2 className="font-semibold">{activeSession.className}</h2>
                    <TimerDisplay />
                </div>
                {isHost && (
                    <Button size="sm" variant="destructive" onClick={onEndSession}>
                        <LogOut className="w-4 h-4 mr-2" />
                        Terminer
                    </Button>
                )}
             </div>
             <ScrollArea className="flex-1">
                <SessionSidebar isHost={isHost} user={user} />
             </ScrollArea>
          </aside>
      </div>
    </div>
  );
}
