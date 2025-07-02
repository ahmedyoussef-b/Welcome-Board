
// src/components/wizard/TeachersForm.tsx
'use client';

import React, { useMemo } from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, BookOpen, Trash2, UserPlus } from 'lucide-react';
import type { TeacherWithDetails, Subject, ClassWithGrade } from '@/types';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { assignClassToTeacher, unassignClassFromTeacher } from '@/lib/redux/features/teachers/teachersSlice';
import { selectAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { selectAllMatieres } from '@/lib/redux/features/subjects/subjectsSlice';
import { useToast } from '@/hooks/use-toast';

// --- Internal Components for Drag and Drop ---

function DraggableClass({ classData }: { classData: ClassWithGrade }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `class-${classData.id}`,
    data: { classData },
  });

  const style = transform ? {
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 10,
    opacity: isDragging ? 0.5 : 1,
  } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-2 border rounded-md bg-background flex items-center gap-2 cursor-grab active:cursor-grabbing active:shadow-lg"
      {...listeners}
      {...attributes}
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{classData.name}</span>
    </div>
  );
}

function TeacherDropzone({ teacher, onUnassign }: { teacher: TeacherWithDetails, onUnassign: (teacherId: string, classId: number) => void }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `teacher-${teacher.id}`,
    data: { teacherId: teacher.id },
  });

  return (
    <div ref={setNodeRef} className={`p-4 rounded-lg border transition-colors ${isOver ? 'bg-primary/20 border-primary' : 'bg-muted/50'}`}>
      <h4 className="font-semibold">{teacher.name} {teacher.surname}</h4>
      <div className="flex flex-wrap gap-2 mt-2 min-h-[36px]">
        {teacher.classes.map(cls => (
          <Badge key={cls.id} variant="secondary" className="flex items-center gap-1">
            {cls.name}
            <button onClick={() => onUnassign(teacher.id, cls.id)} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
              <Trash2 className="h-3 w-3 text-destructive" />
            </button>
          </Badge>
        ))}
        {teacher.classes.length === 0 && <p className="text-xs text-muted-foreground">Déposer des classes ici</p>}
      </div>
    </div>
  );
}


// --- Main Form Component ---

interface TeachersFormProps {
  data: TeacherWithDetails[];
}

const TeachersForm: React.FC<TeachersFormProps> = ({ data: teachers }) => {
  const dispatch = useAppDispatch();
  const allClasses = useAppSelector(selectAllClasses);
  const allSubjects = useAppSelector(selectAllMatieres);
  const { toast } = useToast();

  const subjectsWithTeachers = useMemo(() => {
    const map = new Map<number, { subject: Subject; teachers: TeacherWithDetails[] }>();
    allSubjects.forEach(subject => {
        const teachersForSubject = teachers.filter(teacher => teacher.subjects.some(s => s.id === subject.id));
        if (teachersForSubject.length > 0) {
            map.set(subject.id, { subject, teachers: teachersForSubject });
        }
    });
    return Array.from(map.values());
  }, [teachers, allSubjects]);

  const allAssignedClassIds = useMemo(() => {
    return new Set(teachers.flatMap(t => t.classes.map(c => c.id)));
  }, [teachers]);

  const unassignedClasses = useMemo(() => {
    return allClasses.filter(c => !allAssignedClassIds.has(c.id));
  }, [allClasses, allAssignedClassIds]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const classData = active.data.current?.classData as ClassWithGrade | undefined;
    const teacherId = over.data.current?.teacherId as string | undefined;

    if (classData && teacherId) {
      const teacher = teachers.find(t => t.id === teacherId);
      if (teacher && teacher.classes.some(c => c.id === classData.id)) {
          toast({
              variant: 'destructive',
              title: 'Assignation impossible',
              description: `La classe ${classData.name} est déjà assignée à ${teacher.name} ${teacher.surname}.`,
          });
          return;
      }
      dispatch(assignClassToTeacher({ teacherId, classData }));
    }
  };
  
  const handleUnassign = (teacherId: string, classId: number) => {
      dispatch(unassignClassFromTeacher({ teacherId, classId }));
  };

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="space-y-8">
        <Card className="p-6">
            <div className="flex items-center space-x-2 mb-4">
                <UserPlus className="text-primary" size={20} />
                <h3 className="text-lg font-semibold">Gérer les enseignants</h3>
            </div>
            <p className="text-sm text-muted-foreground">L'ajout et la modification détaillée des enseignants se font désormais dans la section "Enseignants" du menu principal pour une meilleure expérience.</p>
        </Card>

        {/* Global Unassigned Classes Panel */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-2">Classes non assignées ({unassignedClasses.length})</h3>
          <p className="text-sm text-muted-foreground mb-4">Glissez une classe vers un professeur pour l'assigner.</p>
          <div className="p-4 border rounded-lg bg-background min-h-[100px] max-h-[300px] overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
            {unassignedClasses.length > 0 ? (
              unassignedClasses.map(cls => <DraggableClass key={cls.id} classData={cls} />)
            ) : (
              <p className="text-sm text-muted-foreground col-span-full text-center pt-8">
                Toutes les classes ont été assignées.
              </p>
            )}
          </div>
        </Card>

        {/* Loop for subject groups, rendering only teachers */}
        {subjectsWithTeachers.map(({ subject, teachers: subjectTeachers }) => (
            <Card key={subject.id} className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="text-primary" size={20} />
                <h3 className="text-lg font-semibold">Professeurs de : {subject.name}</h3>
              </div>
              <div className="space-y-4">
                  {subjectTeachers.map(teacher => (
                      <TeacherDropzone key={teacher.id} teacher={teacher} onUnassign={handleUnassign}/>
                  ))}
              </div>
            </Card>
        ))}
      </div>
    </DndContext>
  );
};

export default TeachersForm;
