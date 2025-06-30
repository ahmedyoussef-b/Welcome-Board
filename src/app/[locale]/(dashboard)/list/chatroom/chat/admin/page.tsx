'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Video, Users, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { fetchMeetingParticipants, startMeeting } from '@/lib/redux/slices/sessionSlice';
import { addNotification } from '@/lib/redux/slices/notificationSlice';
import TeacherSelector from '@/components/chatroom/dashboard/admin/TeacherSelector';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { Role, Teacher, type SafeUser } from '@/types';
import type { SessionParticipant } from '@/lib/redux/slices/sessionSlice';

export default function AdminMeetingDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser) as SafeUser;
  
  const { meetingCandidates, selectedTeachers, activeSession, loading } = useAppSelector(state => state.session);
  const [meetingTitle, setMeetingTitle] = useState("Réunion d'équipe");

  useEffect(() => {
    if (!user || user.role !== Role.ADMIN) {
      router.replace('/');
      return;
    }
    
    if (activeSession) {
      router.replace('/list/chatroom/session');
    }

    dispatch(fetchMeetingParticipants());
  }, [user, activeSession, router, dispatch]);

  const handleStartMeeting = () => {
    if (selectedTeachers.length === 0 || !meetingTitle.trim()) {
      return;
    }
    
    const adminParticipant: SessionParticipant = {
      id: user.id,
      name: user.name || 'Admin',
      email: user.email,
      role: 'admin',
      img: user.img,
      isOnline: true,
      isInSession: true,
      points: 0,
      badges: [],
    };
    
    const selectedParticipants = meetingCandidates.filter((teacher: SessionParticipant)  =>
      selectedTeachers.includes(teacher.id)
    );
    
    const allParticipants = [adminParticipant, ...selectedParticipants];

    dispatch(startMeeting({
      meetingTitle,
      participants: allParticipants,
    }));
    
    dispatch(addNotification({
      type: 'session_started',
      title: 'Réunion démarrée',
      message: `La réunion "${meetingTitle}" a commencé.`,
    }));

    router.replace('/list/chatroom/session');
  };

  if (loading && meetingCandidates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
                Lancer une Réunion
            </h1>
            <p className="text-gray-600 mt-1">Sélectionnez les professeurs à inviter et démarrez une session de visioconférence.</p>
        </div>

        <Card className="mb-8">
            <CardHeader>
                <CardTitle>Titre de la réunion</CardTitle>
            </CardHeader>
            <CardContent>
                <Input 
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="Ex: Point hebdomadaire"
                />
            </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Sélection des Professeurs
            </CardTitle>
            <CardDescription>
              Choisissez les professeurs qui participeront à la réunion.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeacherSelector teachers={meetingCandidates} />
            
            {selectedTeachers.length > 0 && (
              <div className="mt-6 pt-6 border-t">
                <Button
                  onClick={handleStartMeeting}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 py-6 text-lg font-medium"
                >
                  <Video className="w-5 h-5" />
                  Démarrer la réunion ({selectedTeachers.length} invité{selectedTeachers.length > 1 ? 's' : ''})
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
