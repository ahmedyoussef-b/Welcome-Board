// src/components/wizard/TeachersForm.tsx
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Trash2, UserPlus, Copy, Save, Loader2 } from 'lucide-react';
import type { TeacherWithDetails, Subject, ClassWithGrade } from '@/types';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { assignClassToTeacher, unassignClassFromTeacher, selectAllProfesseurs, saveTeacherAssignments } from '@/lib/redux/features/teachers/teachersSlice';
import { selectAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { selectAllMatieres } from '@/lib/redux/features/subjects/subjectsSlice';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '../ui/button';

// --- Internal Components ---

function SelectableClass({ classData, isSelected, onSelect }: { classData: ClassWithGrade; isSelected: boolean; onSelect: (classData: ClassWithGrade, event: React.MouseEvent) => void; }) {
  return (
    <div
      onClick={(e) => onSelect(classData, e)}
      className={cn(
        "p-2 border rounded-md bg-background flex items-center justify-center gap-2 cursor-pointer transition-all",
        isSelected ? "ring-2 ring-primary bg-primary/10" : "hover:bg-muted"
      )}
      title={`Cliquez pour sélectionner. Maintenez Ctrl/Cmd pour une sélection multiple.`}
    >
      <span className="text-sm font-medium">{classData.name}</span>
    </div>
  );
}

function TeacherCard({ teacher, onUnassign, onAssign }: { teacher: TeacherWithDetails; onUnassign: (teacherId: string, classId: number) => void; onAssign: (teacherId: string) => void; }) {
  return (
    <div
      onDoubleClick={() => onAssign(teacher.id)}
      className="p-4 rounded-lg border bg-muted/50 cursor-pointer hover:bg-primary/10 transition-colors"
      title="Double-cliquez pour assigner la ou les classe(s) sélectionnée(s)"
    >
      <h4 className="font-semibold">{teacher.name} {teacher.surname}</h4>
      <div className="flex flex-wrap gap-2 mt-2 min-h-[36px]">
        {teacher.classes.map(cls => (
          <Badge key={cls.id} variant="secondary" className="flex items-center gap-1">
            {cls.name}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUnassign(teacher.id, cls.id);
              }}
              className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </button>
          </Badge>
        ))}
        {teacher.classes.length === 0 && <p className="text-xs text-muted-foreground">Double-cliquez pour assigner une classe</p>}
      </div>
    </div>
  );
}

// --- Main Form Component ---

const TeachersForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const allTeachers = useAppSelector(selectAllProfesseurs);
  const allClasses = useAppSelector(selectAllClasses);
  const allSubjects = useAppSelector(selectAllMatieres);

  const [selectedClasses, setSelectedClasses] = useState<ClassWithGrade[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleSelectClass = (classData: ClassWithGrade, event: React.MouseEvent) => {
    const isAlreadySelected = selectedClasses.some(c => c.id === classData.id);

    if (event.ctrlKey || event.metaKey) { // For Ctrl/Cmd click
      if (isAlreadySelected) {
        setSelectedClasses(prev => prev.filter(c => c.id !== classData.id));
      } else {
        setSelectedClasses(prev => [...prev, classData]);
      }
    } else { // For single click
      if (isAlreadySelected && selectedClasses.length === 1) {
        setSelectedClasses([]);
      } else {
        setSelectedClasses([classData]);
      }
    }
  };
  
  const handleAssignClass = (teacherId: string) => {
    if (selectedClasses.length === 0) {
        toast({
            variant: 'destructive',
            title: 'Aucune classe sélectionnée',
            description: 'Veuillez cliquer sur une ou plusieurs classes pour les sélectionner avant de les assigner.',
        });
        return;
    }

    const teacher = allTeachers.find(t => t.id === teacherId);
    if (!teacher) return;
    
    selectedClasses.forEach(classData => {
        const isAlreadyAssigned = teacher.classes.some(c => c.id === classData.id);
        if (!isAlreadyAssigned) {
            dispatch(assignClassToTeacher({ teacherId, classData }));
        }
    });

    setSelectedClasses([]); 
  };

  const handleUnassign = (teacherId: string, classId: number) => {
      dispatch(unassignClassFromTeacher({ teacherId, classId }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const assignmentPayload = allTeachers.map(teacher => ({
        teacherId: teacher.id,
        classIds: teacher.classes.map(cls => cls.id),
    }));

    const result = await dispatch(saveTeacherAssignments(assignmentPayload));
    
    if (saveTeacherAssignments.fulfilled.match(result)) {
        toast({
            title: "Sauvegarde réussie",
            description: "Les assignations des professeurs ont été enregistrées.",
        });
    } else {
        toast({
            variant: "destructive",
            title: "Erreur de sauvegarde",
            description: "Une erreur est survenue lors de la sauvegarde des assignations.",
        });
    }
    setIsSaving(false);
  };

  return (
      <div className="space-y-8">
        <Card className="p-6 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                    <UserPlus className="text-primary" size={20} />
                    <h3 className="text-lg font-semibold">Assigner les classes aux enseignants</h3>
                </div>
                <Button onClick={handleSaveChanges} disabled={isSaving}>
                    {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    {isSaving ? 'Sauvegarde...' : 'Sauvegarder les Assignations'}
                </Button>
            </div>
            <p className="text-sm text-muted-foreground">Cliquez pour sélectionner, Ctrl+Clic pour une sélection multiple. Double-cliquez sur un professeur pour assigner.</p>
            {selectedClasses.length > 0 && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center gap-2 text-primary border border-primary/20">
                    <Copy size={16} />
                    <p className="text-sm font-medium">
                        {selectedClasses.length} classe{selectedClasses.length > 1 ? 's' : ''} sélectionnée{selectedClasses.length > 1 ? 's' : ''} : {selectedClasses.map(c => c.name).join(', ')}
                    </p>
                </div>
            )}
        </Card>

        {allSubjects.map((subject) => {
            const subjectTeachers = allTeachers.filter(teacher =>
                teacher.subjects.some(s => s.id === subject.id)
            );

            if (subjectTeachers.length === 0) {
                return null;
            }

            const unassignedClassesForGroup = allClasses.filter(
                c => !subjectTeachers.some(t => t.classes.some(assignedClass => assignedClass.id === c.id))
            );

            return (
                <Card key={subject.id} className="p-6">
                    <div className="flex items-center space-x-2 mb-4">
                        <BookOpen className="text-primary" size={20} />
                        <h3 className="text-lg font-semibold">Matière : {subject.name}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="md:col-span-1">
                             <h4 className="font-semibold mb-2">Classes non assignées ({unassignedClassesForGroup.length})</h4>
                            <div className="p-4 border rounded-lg bg-background min-h-[100px] max-h-[400px] overflow-y-auto grid grid-cols-1 gap-2">
                                {unassignedClassesForGroup.length > 0 ? (
                                    unassignedClassesForGroup.map(cls => (
                                        <SelectableClass
                                            key={cls.id}
                                            classData={cls}
                                            isSelected={selectedClasses.some(c => c.id === cls.id)}
                                            onSelect={handleSelectClass}
                                        />
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center pt-8">
                                    Toutes les classes ont été assignées pour cette matière.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="space-y-4 md:col-span-2">
                            <h4 className="font-semibold mb-2">Professeurs de {subject.name}</h4>
                            {subjectTeachers.map(teacher => (
                                <TeacherCard
                                    key={teacher.id}
                                    teacher={teacher}
                                    onUnassign={handleUnassign}
                                    onAssign={handleAssignClass}
                                />
                            ))}
                        </div>
                    </div>
                </Card>
            )
        })}
      </div>
  );
};

export default TeachersForm;
