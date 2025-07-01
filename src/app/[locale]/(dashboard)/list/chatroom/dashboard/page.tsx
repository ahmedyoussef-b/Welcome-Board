// src/app/[locale]/(dashboard)/list/chatroom/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LogOut, Video, Users, BarChart3, MessageCircle, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { useLogoutMutation } from "@/lib/redux/api/authApi";
import { setSelectedClass, startSession, fetchChatroomClasses, type SessionParticipant, type ClassRoom } from "@/lib/redux/slices/sessionSlice";
import { addNotification } from "@/lib/redux/slices/notificationSlice";
import ClassCard from '@/components/chatroom/dashboard/ClassCard';
import StudentSelector from '@/components/chatroom/dashboard/StudentSelector';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { Role } from '@/types';
import { Spinner } from '@/components/ui/spinner';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const [logout] = useLogoutMutation();

  const { classes, selectedClass, selectedStudents, activeSession, loading } = useAppSelector(state => state.session);

  useEffect(() => {
    if (!user || user.role !== Role.TEACHER) {
      router.replace('/fr');
      return;
    }

    if (activeSession) {
      router.replace('/fr/list/chatroom/session');
    }
  }, [user, activeSession, router]);

  useEffect(() => {
    dispatch(fetchChatroomClasses());
  }, [dispatch]);
  
  const handleLogout = () => {
    logout();
    router.replace('/fr');
  };

  const handleClassSelect = (classroom: ClassRoom) => {
    dispatch(setSelectedClass(classroom));
  };

  const handleStartSession = () => {
    if (!selectedClass || selectedStudents.length === 0) {
      return;
    }

    dispatch(startSession({
      classId: String(selectedClass.id),
      className: selectedClass.name,
    }));

    dispatch(addNotification({
      type: 'session_started',
      title: 'Session démarrée',
      message: `La session ${selectedClass.name} a commencé avec ${selectedStudents.length} élève(s)`,
    }));

    router.replace('/fr/list/chatroom/session');
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <img
              src={user.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.name}`}
              alt={user.name || ''}
              className="w-12 h-12 rounded-full"
            />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Bonjour, {user.name}
              </h1>
              <p className="text-gray-600">Tableau de bord professeur</p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push('/fr/list/chatroom/chat/teachers')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Chat Professeurs
            </Button>

            <Button
              onClick={() => router.push('/fr/list/chatroom/reports')}
              variant="outline"
              className="flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Rapports
            </Button>
            
            <Button
              onClick={handleLogout}
              variant="outline"
              className="flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Se déconnecter
            </Button>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        )}

        {/* Classes Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {classes.map((classroom) => (
              <ClassCard
                key={classroom.id}
                classroom={classroom}
                isSelected={selectedClass?.id === classroom.id}
                onSelect={handleClassSelect}
              />
            ))}
          </div>
        )}

        {/* Student Selection */}
        {selectedClass && (
          <Card className="mb-8">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" />
                    Sélection des élèves - {selectedClass.name}
                  </CardTitle>
                  <CardDescription>
                    Choisissez les élèves qui participeront à la session
                  </CardDescription>
                </div>
                <Badge variant="outline">
                  {selectedStudents.length} sélectionné(s)
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <StudentSelector classroom={selectedClass} />
              
              {selectedStudents.length > 0 && (
                <div className="mt-6 pt-6 border-t">
                  <Button
                    onClick={handleStartSession}
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex items-center gap-2 py-6 text-lg font-medium"
                  >
                    <Video className="w-5 h-5" />
                    Démarrer la session ({selectedStudents.length} élève{selectedStudents.length > 1 ? 's' : ''})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
