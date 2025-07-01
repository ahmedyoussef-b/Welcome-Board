// src/components/chatroom/session/SessionSidebar.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import CreatePollDialog from './CreatePollDialog';
import CreateQuizDialog from './CreateQuizDialog';
import RaiseHandButton from './RaiseHandButton';
import TimerControls from './TimerControls';
import type { ActiveSession, SafeUser, SessionParticipant } from '@/types';

interface SessionSidebarProps {
  isHost: boolean;
  currentUserParticipant: SessionParticipant | undefined;
  activeSession: ActiveSession;
  user: SafeUser | null;
}

export default function SessionSidebar({ isHost, currentUserParticipant, activeSession, user }: SessionSidebarProps) {
  const onlineCount = activeSession.participants.filter(p => p.isOnline).length;
  const totalCount = activeSession.participants.length;

  return (
    <div className="space-y-4">
      {isHost && (
        <Card>
          <CardHeader>
              <CardTitle className="text-base">Outils d'animation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
              <TimerControls />
              <CreatePollDialog />
              {activeSession.sessionType === 'class' && <CreateQuizDialog />}
          </CardContent>
        </Card>
      )}

      {currentUserParticipant && currentUserParticipant.role === 'student' && user && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <RaiseHandButton studentId={user.id} studentName={user.name || ''} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Statistiques</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Participants</span>
            <span>{onlineCount}/{totalCount}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Mains levées</span>
            <span>{activeSession.raisedHands.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Réactions</span>
            <span>{activeSession.reactions.length}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Sondages</span>
            <span>{activeSession.polls.length}</span>
          </div>
           {activeSession.sessionType === 'class' && (
              <>
                  <div className="flex justify-between text-sm">
                    <span>Quiz</span>
                    <span>{activeSession.quizzes.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Points totaux</span>
                    <span>{activeSession.participants.reduce((total, p) => total + (p.points || 0), 0)}</span>
                  </div>
              </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
