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
import { Role, type SafeUser } from '@/types';
import type { SessionParticipant } from '@/lib/redux/slices/sessionSlice';

export default function AdminMeetingDashboard() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser) as SafeUser;
  
  const { meetingCandidates, selectedTeachers, activeSession, loading } = useAppSelector(state => state.session);
  const [meetingTitle, setMeetingTitle] = useState("Réunion d'équipe");

  useEffect(() => {
    if (!user || user.role !== Role.ADMIN) {
      router.replace('/fr');
      return;
    }
    
    if (activeSession) {
      router.replace('/fr/list/chatroom/session');
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

    router.replace('/fr/list/chatroom/session');
  };

  if (loading && meetingCandidates.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <Loader2 className="w-8 h-8 animate-spin text-sky-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-400 to-cyan-300 bg-clip-text text-transparent">
                Lancer une Réunion
            </h1>
            <p className="text-gray-400 mt-2">Sélectionnez les professeurs à inviter et démarrez une session de visioconférence.</p>
        </div>

        <Card className="mb-8 bg-gray-800/50 backdrop-blur-sm border-gray-700 shadow-xl">
            <CardHeader>
                <CardTitle className="text-gray-200">Titre de la réunion</CardTitle>
            </CardHeader>
            <CardContent>
                <Input 
                    value={meetingTitle}
                    onChange={(e) => setMeetingTitle(e.target.value)}
                    placeholder="Ex: Point hebdomadaire"
                    className="bg-gray-900 border-gray-700 text-white placeholder:text-gray-500 focus:ring-sky-500"
                />
            </CardContent>
        </Card>

        <Card className="bg-gray-800/50 backdrop-blur-sm border-gray-700 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-3 text-gray-200">
              <Users className="w-6 h-6 text-sky-400" />
              Sélection des Professeurs
            </CardTitle>
            <CardDescription className="text-gray-400">
              Choisissez les professeurs qui participeront à la réunion. Les professeurs hors ligne ne peuvent pas être sélectionnés.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <TeacherSelector teachers={meetingCandidates} />
            
            {selectedTeachers.length > 0 && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <Button
                  onClick={handleStartMeeting}
                  className="w-full bg-gradient-to-r from-sky-500 to-cyan-500 hover:from-sky-600 hover:to-cyan-600 flex items-center gap-2 py-6 text-lg font-medium text-white rounded-full shadow-lg hover:shadow-cyan-500/20 transition-all duration-300"
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
