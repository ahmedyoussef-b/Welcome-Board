
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Search, Video, ArrowLeft } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { toggleStudentSelection, startSession, setSelectedClass } from '@/lib/redux/slices/sessionSlice';
import type { ClassRoom, SessionParticipant } from '@/lib/redux/slices/sessionSlice';

interface StudentSelectorProps {
  classroom: ClassRoom;
}

export default function StudentSelector({ classroom }: StudentSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const dispatch = useAppDispatch();
  const { selectedStudents } = useAppSelector(state => state.session);

  const filteredStudents = classroom.students.filter(student =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStudentToggle = (studentId: string) => {
    dispatch(toggleStudentSelection(studentId));
  };

  const handleStartSession = () => {
    if (selectedStudents.length === 0) return;
    
    dispatch(startSession({
      classId: classroom.id,
      className: classroom.name,
    }));
    
    console.log('Notifications envoyées aux élèves:', selectedStudents);
  };

  const handleBack = () => {
    dispatch(setSelectedClass(null));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          onClick={handleBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Retour
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{classroom.name}</h2>
          <p className="text-gray-600">Sélectionnez les élèves pour la session</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Élèves disponibles</span>
            <Badge variant="outline" className="bg-blue-50 text-blue-700">
              {selectedStudents.length} sélectionné{selectedStudents.length > 1 ? 's' : ''}
            </Badge>
          </CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Rechercher un élève..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {filteredStudents.map((student: SessionParticipant) => (
              <div
                key={student.id}
                className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition-colors"
              >
                <Checkbox
                  id={student.id}
                  checked={selectedStudents.includes(student.id)}
                  onCheckedChange={() => handleStudentToggle(student.id)}
                  disabled={!student.isOnline}
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <img
                      src={student.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
                      alt={student.name}
                      className="w-8 h-8 rounded-full"
                    />
                    <div>
                      <p className="font-medium text-gray-900">{student.name}</p>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge
                    variant={student.isOnline ? "default" : "secondary"}
                    className={
                      student.isOnline 
                        ? "bg-green-100 text-green-800" 
                        : "bg-gray-100 text-gray-600"
                    }
                  >
                    {student.isOnline ? "En ligne" : "Hors ligne"}
                  </Badge>
                </div>
              </div>
            ))}
            
            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Aucun élève trouvé</p>
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-6 border-t">
            <Button
              onClick={handleStartSession}
              disabled={selectedStudents.length === 0}
              className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-400 py-6 text-lg font-medium"
            >
              <Video className="w-5 h-5 mr-2" />
              Lancer la session ({selectedStudents.length} élève{selectedStudents.length > 1 ? 's' : ''})
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
