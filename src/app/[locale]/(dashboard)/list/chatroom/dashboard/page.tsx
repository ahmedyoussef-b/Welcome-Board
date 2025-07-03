// src/app/[locale]/(dashboard)/list/chatroom/dashboard/page.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { LogOut, BarChart3, MessageCircle, Loader2 } from 'lucide-react';
import { useAppDispatch, useAppSelector } from "@/hooks/redux-hooks";
import { useLogoutMutation } from "@/lib/redux/api/authApi";
import { setSelectedClass, fetchChatroomClasses, type ClassRoom } from "@/lib/redux/slices/sessionSlice";
import ClassCard from '@/components/chatroom/dashboard/ClassCard';
import StudentSelector from '@/components/chatroom/dashboard/StudentSelector';
import { selectCurrentUser } from '@/lib/redux/slices/authSlice';
import { Role } from '@/types';
import { Spinner } from '@/components/ui/spinner';
import { useToast } from '@/hooks/use-toast';

export default function DashboardPage() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectCurrentUser);
  const [logout, { isLoading: isLoggingOut }] = useLogoutMutation();
  const { toast } = useToast();

  const { classes, selectedClass, activeSession, loading } = useAppSelector(state => state.session);

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
    if (classes.length === 0 && !loading) {
        dispatch(fetchChatroomClasses());
    }
  }, [dispatch, classes.length, loading]);
  
  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast({ title: "Déconnexion réussie" });
      router.push('/fr');
    } catch {
      toast({ variant: "destructive", title: "Échec de la déconnexion" });
      router.push('/fr');
    }
  };

  const handleClassSelect = (classroom: ClassRoom) => {
    dispatch(setSelectedClass(classroom));
  };

  if ((loading && classes.length === 0) || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header - Always shown */}
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
              disabled={isLoggingOut}
            >
              {isLoggingOut ? <Spinner size="sm" className="mr-2" /> : <LogOut className="w-4 h-4" />}
              {isLoggingOut ? "Déconnexion..." : "Se déconnecter"}
            </Button>
          </div>
        </div>
        
        {/* Conditional View: Class Grid or Student Selector */}
        {selectedClass ? (
          <StudentSelector classroom={selectedClass} />
        ) : (
          loading ? (
            <div className="flex justify-center items-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {classes.map((classroom) => (
                <ClassCard
                  key={classroom.id}
                  classroom={classroom}
                  isSelected={false} // isSelected is always false when showing the grid
                  onSelect={handleClassSelect}
                />
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
