// src/components/chatroom/session/SessionRoom.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, Video, Settings, LogOut, MessageSquare, Hand, BarChart3, Brain, Trophy } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { endSession, updateStudentPresence, tickTimer } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';
import { addSessionReport, type SessionReport } from '@/lib/redux/slices/reportSlice';
import TimerDisplay from './TimerDisplay';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';

// Import newly created components
import OverviewTab from './tabs/OverviewTab';
import InteractionsTab from './tabs/InteractionsTab';
import ActivitiesTab from './tabs/ActivitiesTab';
import QuizzesTab from './tabs/QuizzesTab';
import RewardsTab from './tabs/RewardsTab';
import SessionSidebar from './SessionSidebar';

export default function SessionRoom() {
  const dispatch = useAppDispatch();
  const { activeSession } = useAppSelector(state => state.session);
  const user = useAppSelector(selectCurrentUser);
  const [selectedTab, setSelectedTab] = useState('overview');

  // Simulate student presence updates
  useEffect(() => {
    if (!activeSession) return;

    const interval = setInterval(() => {
      activeSession.participants.forEach(participant => {
        if (participant.role === 'admin') return; // Don't simulate admin presence
        const shouldUpdate = Math.random() < 0.1; // 10% chance per interval
        if (shouldUpdate) {
          dispatch(updateStudentPresence({
            studentId: participant.id,
            isOnline: Math.random() > 0.2, // 80% chance to be online
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

  const handleEndSession = () => {
    if (!activeSession || !user) return;

    const endTime = new Date();
    const sessionDuration = (endTime.getTime() - new Date(activeSession.startTime).getTime()) / 1000;

    if (activeSession.sessionType === 'class') {
        const report: SessionReport = {
          id: activeSession.id,
          classId: activeSession.classId,
          className: activeSession.className,
          teacherId: user.id,
          teacherName: user.name || user.email,
          startTime: activeSession.startTime,
          endTime: endTime.toISOString(),
          duration: Math.round(sessionDuration),
          participants: activeSession.participants.map(p => {
            const joinTime = new Date(activeSession.startTime); 
            const participantDuration = (endTime.getTime() - joinTime.getTime()) / 1000;
            return {
              id: p.id,
              name: p.name,
              email: p.email,
              joinTime: activeSession.startTime,
              leaveTime: endTime.toISOString(),
              duration: Math.round(participantDuration),
            };
          }),
          maxParticipants: activeSession.participants.length,
          status: 'completed',
        };
        dispatch(addSessionReport(report));
    }
    
    dispatch(endSession());
    dispatch(addNotification({
      type: 'session_ended',
      title: 'Session terminée',
      message: 'La session a été fermée et le rapport a été généré.',
    }));
  };

  if (!activeSession) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle>Aucune session active</CardTitle>
            <CardDescription>
              Veuillez démarrer une session depuis le tableau de bord
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  const onlineCount = activeSession.participants.filter(p => p.isOnline).length;
  const totalCount = activeSession.participants.length;

  const isHost = 
    (user?.role === 'TEACHER' && activeSession.sessionType === 'class') ||
    (user?.role === 'ADMIN' && activeSession.sessionType === 'meeting');

  const isParticipant = activeSession.participants.some(p => p.id === user?.id);

  if (!isHost && !isParticipant) {
      return <div>Accès non autorisé à cette session.</div>
  }

  const currentUserParticipant = activeSession.participants.find(p => p.id === user?.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-semibold">{activeSession.className}</h1>
                <p className="text-sm text-gray-500">
                  Démarrée à {new Date(activeSession.startTime).toLocaleTimeString('fr-FR', { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {onlineCount}/{totalCount} en ligne
              </Badge>
              <TimerDisplay />
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Settings className="w-4 h-4" />
              </Button>
              {isHost && (
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={handleEndSession}
                >
                  <LogOut className="w-4 h-4 mr-1" />
                  Terminer
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 md:grid-cols-5">
                <TabsTrigger value="overview" className="flex items-center gap-2">
                  <Video className="w-4 h-4" />
                  Participants
                </TabsTrigger>
                <TabsTrigger value="interactions" className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Interactions
                </TabsTrigger>
                <TabsTrigger value="activities" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Activités
                </TabsTrigger>
                {activeSession.sessionType === 'class' && (
                    <>
                        <TabsTrigger value="quizzes" className="flex items-center gap-2">
                            <Brain className="w-4 h-4" />
                            Quiz
                        </TabsTrigger>
                        <TabsTrigger value="rewards" className="flex items-center gap-2">
                            <Trophy className="w-4 h-4" />
                            Récompenses
                        </TabsTrigger>
                    </>
                )}
              </TabsList>
              
              <TabsContent value="overview" className="mt-6">
                 <OverviewTab activeSession={activeSession} user={user} />
              </TabsContent>
              
              <TabsContent value="interactions" className="mt-6">
                <InteractionsTab isHost={isHost} user={user} />
              </TabsContent>
              
              <TabsContent value="activities" className="mt-6">
                <ActivitiesTab currentUserParticipant={currentUserParticipant} isHost={isHost} />
              </TabsContent>

              {activeSession.sessionType === 'class' && (
                  <>
                    <TabsContent value="quizzes" className="mt-6">
                        <QuizzesTab currentUserParticipant={currentUserParticipant} isHost={isHost} />
                    </TabsContent>
                    <TabsContent value="rewards" className="mt-6">
                        <RewardsTab isHost={isHost} />
                    </TabsContent>
                  </>
              )}

            </Tabs>
          </div>
          
          <SessionSidebar 
            isHost={isHost} 
            currentUserParticipant={currentUserParticipant}
            activeSession={activeSession}
            user={user}
          />
        </div>
      </div>
    </div>
  );
}
