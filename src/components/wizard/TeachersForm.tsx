
// src/components/wizard/TeachersForm.tsx
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Calendar, Loader2 } from 'lucide-react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { addProfesseur, deleteProfesseur } from '@/lib/redux/features/teachers/teachersSlice';
import type { TeacherWithDetails, CreateTeacherPayload, Subject, ClassWithGrade } from '@/types';
import { useToast } from '@/hooks/use-toast';

interface TeachersFormProps {
  data: TeacherWithDetails[];
  allSubjects: Subject[];
  allClasses: ClassWithGrade[];
}

const TeachersForm: React.FC<TeachersFormProps> = ({ data, allSubjects, allClasses }) => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();
  const [newTeacher, setNewTeacher] = useState<CreateTeacherPayload>({
    email: '',
    username: '',
    name: '',
    surname: '',
    phone: '',
    address: '',
    subjects: [],
    classes: [],
  });
  const [isAdding, setIsAdding] = useState(false);

  const handleAddTeacher = async () => {
    if (isAdding || !newTeacher.name || !newTeacher.surname || !newTeacher.email || !newTeacher.username) return;
    
    const emailExists = data.some(t => t.user?.email.trim().toLowerCase() === newTeacher.email.trim().toLowerCase());
    if (emailExists) {
      toast({
        variant: 'destructive',
        title: 'Email existant',
        description: `Un enseignant avec l'email "${newTeacher.email}" existe déjà.`,
      });
      return;
    }

    const usernameExists = data.some(t => t.user?.username.trim().toLowerCase() === newTeacher.username.trim().toLowerCase());
    if (usernameExists) {
      toast({
        variant: 'destructive',
        title: "Nom d'utilisateur existant",
        description: `Un enseignant avec le nom d'utilisateur "${newTeacher.username}" existe déjà.`,
      });
      return;
    }

    setIsAdding(true);
    const result = await dispatch(addProfesseur(newTeacher));
    setIsAdding(false);

    if (addProfesseur.fulfilled.match(result)) {
      toast({
        title: 'Enseignant ajouté',
        description: `Le profil pour ${result.payload.name} ${result.payload.surname} a été créé.`,
      });
      setNewTeacher({ email: '', username: '', name: '', surname: '', phone: '', address: '', subjects: [], classes: [] });
    } else {
      toast({
        variant: 'destructive',
        title: "Erreur d'ajout",
        description: (result.payload as string) || 'Une erreur est survenue.',
      });
    }
  };

  const handleDeleteTeacher = (id: string) => {
    dispatch(deleteProfesseur(id));
  };
  
  const handleSubjectSelection = (subjectId: string) => {
    const currentSubjects = newTeacher.subjects || [];
    const updatedSubjects = currentSubjects.includes(subjectId)
      ? currentSubjects.filter(id => id !== subjectId)
      : [...currentSubjects, subjectId];
    setNewTeacher(prev => ({ ...prev, subjects: updatedSubjects }));
  };

  const handleClassSelection = (classId: string) => {
    const currentClasses = newTeacher.classes || [];
    const updatedClasses = currentClasses.includes(classId)
      ? currentClasses.filter(id => id !== classId)
      : [...currentClasses, classId];
    setNewTeacher(prev => ({ ...prev, classes: updatedClasses }));
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <UserPlus className="text-primary" size={20} />
          <h3 className="text-lg font-semibold">Ajouter un enseignant</h3>
        </div>
        
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Prénom</Label><Input value={newTeacher.name} onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})} placeholder="AHMED" className="mt-1" disabled={isAdding}/></div>
            <div><Label>Nom</Label><Input value={newTeacher.surname} onChange={(e) => setNewTeacher({...newTeacher, surname: e.target.value})} placeholder="ABBES" className="mt-1" disabled={isAdding}/></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Email</Label><Input type="email" value={newTeacher.email} onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})} placeholder="ahmedyoussefabbes@gmail.com" className="mt-1" disabled={isAdding}/></div>
            <div><Label>Nom d'utilisateur</Label><Input value={newTeacher.username} onChange={(e) => setNewTeacher({...newTeacher, username: e.target.value})} placeholder="ABBES" className="mt-1" disabled={isAdding}/></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div><Label>Téléphone (Optionnel)</Label><Input value={newTeacher.phone} onChange={(e) => setNewTeacher({...newTeacher, phone: e.target.value})} className="mt-1" disabled={isAdding}/></div>
            <div><Label>Adresse (Optionnel)</Label><Input value={newTeacher.address} onChange={(e) => setNewTeacher({...newTeacher, address: e.target.value})} className="mt-1" disabled={isAdding}/></div>
          </div>
          <div>
            <Label>Matières enseignées</Label>
            <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded-md min-h-[40px]">
                {allSubjects.map(subject => (
                    <Button 
                      key={subject.id}
                      type="button"
                      variant={(newTeacher.subjects || []).includes(String(subject.id)) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleSubjectSelection(String(subject.id))}
                    >
                      {subject.name}
                    </Button>
                ))}
            </div>
          </div>
           <div>
            <Label>Classes assignées (Optionnel)</Label>
            <div className="flex flex-wrap gap-2 mt-2 p-2 border rounded-md min-h-[40px]">
                {allClasses.map(cls => (
                    <Button 
                      key={cls.id}
                      type="button"
                      variant={(newTeacher.classes || []).includes(String(cls.id)) ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => handleClassSelection(String(cls.id))}
                    >
                      {cls.name}
                    </Button>
                ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Si aucune classe n'est assignée, l'enseignant sera considéré comme disponible pour toutes les classes.</p>
          </div>

          <Button onClick={handleAddTeacher} disabled={isAdding || !newTeacher.name || !newTeacher.surname || !newTeacher.email || !newTeacher.username} className="w-full">
            {isAdding && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isAdding ? 'Ajout en cours...' : "Ajouter l'enseignant"}
          </Button>
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <Calendar className="text-primary" size={20} />
            <h3 className="text-lg font-semibold">Enseignants configurés ({data.length})</h3>
          </div>
        </div>
        
        {data.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground"><Calendar size={48} className="mx-auto mb-4 text-muted" /><p>Aucun enseignant configuré</p><p className="text-sm">Commencez par créer un profil</p></div>
        ) : (
          <div className="space-y-4">
            {data.map((teacher) => (
              <Card key={teacher.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2"><h4 className="font-semibold text-lg">{teacher.name} {teacher.surname}</h4></div>
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Matières enseignées:</p>
                        <div className="flex flex-wrap gap-1">
                          {teacher.subjects.length > 0 ? teacher.subjects.map(subject => <Badge key={subject.id} variant="secondary" className="text-xs">{subject.name}</Badge>) : <span className="text-xs text-muted-foreground">Aucune</span>}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">Classes assignées:</p>
                        <div className="flex flex-wrap gap-1">
                          {teacher.classes.length > 0 ? teacher.classes.map(cls => <Badge key={cls.id} variant="outline" className="text-xs">{cls.name}</Badge>) : <span className="text-xs text-muted-foreground">Toutes (flottant)</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteTeacher(teacher.id)} className="text-destructive hover:text-destructive/90"><Trash2 size={16} /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};

export default TeachersForm;
