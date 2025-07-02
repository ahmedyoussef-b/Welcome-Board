// src/components/wizard/TeachersForm.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BookOpen, Trash2, UserPlus, Copy } from 'lucide-react';
import type { TeacherWithDetails, Subject, ClassWithGrade } from '@/types';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { assignClassToTeacher, unassignClassFromTeacher, selectAllProfesseurs } from '@/lib/redux/features/teachers/teachersSlice';
import { selectAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { selectAllMatieres } from '@/lib/redux/features/subjects/subjectsSlice';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

// --- Internal Components for the new double-click interaction ---

function SelectableClass({ classData, isSelected, onSelect }: { classData: ClassWithGrade; isSelected: boolean; onSelect: (classData: ClassWithGrade) => void; }) {
  return (
    <div
      onDoubleClick={() => onSelect(classData)}
      className={cn(
        "p-2 border rounded-md bg-background flex items-center justify-center gap-2 cursor-pointer transition-all",
        isSelected ? "ring-2 ring-primary bg-primary/10" : "hover:bg-muted"
      )}
      title={`Double-cliquez pour ${isSelected ? 'désélectionner' : 'sélectionner'} ${classData.name}`}
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
      title="Double-cliquez pour assigner la classe sélectionnée"
    >
      <h4 className="font-semibold">{teacher.name} {teacher.surname}</h4>
      <div className="flex flex-wrap gap-2 mt-2 min-h-[36px]">
        {teacher.classes.map(cls => (
          <Badge key={cls.id} variant="secondary" className="flex items-center gap-1">
            {cls.name}
            <button
              onClick={(e) => {
                e.stopPropagation(); // Prevent the double-click event on the parent div
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

  const [selectedClass, setSelectedClass] = useState<ClassWithGrade | null>(null);

  const handleSelectClass = (classData: ClassWithGrade) => {
    if (selectedClass?.id === classData.id) {
        setSelectedClass(null);
    } else {
        setSelectedClass(classData);
    }
  };

  const handleAssignClass = (teacherId: string) => {
    if (!selectedClass) {
        toast({
            variant: 'destructive',
            title: 'Aucune classe sélectionnée',
            description: 'Veuillez double-cliquer sur une classe pour la sélectionner avant de l\'assigner.',
        });
        return;
    }

    const teacher = allTeachers.find(t => t.id === teacherId);
    if (teacher && teacher.classes.some(c => c.id === selectedClass.id)) {
        toast({
            variant: 'destructive',
            title: 'Assignation impossible',
            description: `La classe ${selectedClass.name} est déjà assignée à ${teacher.name} ${teacher.surname}.`,
        });
        return;
    }

    dispatch(assignClassToTeacher({ teacherId, classData: selectedClass }));
    setSelectedClass(null); // Clear selection after assignment
  };

  const handleUnassign = (teacherId: string, classId: number) => {
      dispatch(unassignClassFromTeacher({ teacherId, classId }));
  };

  return (
      <div className="space-y-8">
        <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
                <UserPlus className="text-primary" size={20} />
                <h3 className="text-lg font-semibold">Assigner les classes aux enseignants</h3>
            </div>
            <p className="text-sm text-muted-foreground">Double-cliquez sur une classe pour la sélectionner, puis double-cliquez sur un professeur pour la lui assigner.</p>
            {selectedClass && (
                <div className="mt-4 p-3 bg-primary/10 rounded-lg flex items-center gap-2 text-primary border border-primary/20">
                    <Copy size={16} />
                    <p className="text-sm font-medium">Classe sélectionnée : <strong>{selectedClass.name}</strong></p>
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

            const assignedClassIdsInGroup = new Set(
                subjectTeachers.flatMap(t => t.classes.map(c => c.id))
            );

            const unassignedClassesForGroup = allClasses.filter(
                c => !assignedClassIdsInGroup.has(c.id)
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
                                            isSelected={selectedClass?.id === cls.id}
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
