'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { toggleTeacherSelection } from '@/lib/redux/slices/sessionSlice';
import type { SessionParticipant } from '@/lib/redux/slices/sessionSlice';
import { ScrollArea } from '@/components/ui/scroll-area';

interface TeacherSelectorProps {
  teachers: SessionParticipant[];
}

export default function TeacherSelector({ teachers }: TeacherSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useAppDispatch();
  const { selectedTeachers } = useAppSelector(state => state.session);

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleTeacherToggle = (teacherId: string) => {
    dispatch(toggleTeacherSelection(teacherId));
  };

  return (
    <div className="space-y-4">
        <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un professeur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
        </div>
        
        <ScrollArea className="h-96">
            <div className="space-y-3 pr-4">
            {filteredTeachers.map((teacher) => (
              <div
                key={teacher.id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  id={`teacher-${teacher.id}`}
                  checked={selectedTeachers.includes(teacher.id)}
                  onCheckedChange={() => handleTeacherToggle(teacher.id)}
                  disabled={!teacher.isOnline}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <img
                      src={teacher.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${teacher.name}`}
                      alt={teacher.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{teacher.name}</p>
                      <p className="text-sm text-gray-500">{teacher.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge
                    variant={teacher.isOnline ? "default" : "secondary"}
                    className={
                      teacher.isOnline 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-600"
                    }
                  >
                    {teacher.isOnline ? "En ligne" : "Hors ligne"}
                  </Badge>
                </div>
              </div>
            ))}
            
            {filteredTeachers.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun professeur trouvé</p>
              </div>
            )}
          </div>
        </ScrollArea>
    </div>
  );
}
