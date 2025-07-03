
'use client';

import { useAppSelector, useAppDispatch } from '@/hooks/redux-hooks';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SessionRoom from '@/components/chatroom/session/SessionRoom';
import { endSession } from '@/lib/redux/slices/sessionSlice';
import { addSessionReport, type SessionReport } from '@/lib/redux/slices/reportSlice';
import { useRouter } from 'next/navigation';
import { addNotification } from '@/lib/redux/slices/notificationSlice';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';

export default function SessionPage() {
    const dispatch = useAppDispatch();
    const router = useRouter();
    const { activeSession } = useAppSelector(state => state.session);
    const user = useAppSelector(selectCurrentUser);

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
                const joinTime = new Date(activeSession.startTime); // Simplified; a real impl would track individual join times
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
    
        if (user.role === 'TEACHER') {
            router.replace('/fr/list/chatroom/reports');
        } else if (user.role === 'ADMIN') {
            router.replace('/fr/admin/chatroom');
        }
    };

    if (!activeSession) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle>Aucune session active</CardTitle>
                        <CardDescription>
                            Veuillez démarrer une session depuis le tableau de bord.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return <SessionRoom onEndSession={handleEndSession} />;
}
