// src/components/wizard/TeachersForm.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { DndContext, useDraggable, useDroppable, type DragEndEvent } from '@dnd-kit/core';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GripVertical, BookOpen, Trash2, UserPlus } from 'lucide-react';
import type { TeacherWithDetails, Subject, ClassWithGrade } from '@/types';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { assignClassToTeacher, unassignClassFromTeacher } from '@/lib/redux/features/teachers/teachersSlice';
import { selectAllClasses } from '@/lib/redux/features/classes/classesSlice';
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

function TeacherDropzone({ teacher, onUnassign }: { teacher: TeacherWithDetails, onUnassign: (classId: number) => void }) {
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
            <button onClick={() => onUnassign(cls.id)} className="ml-1 rounded-full hover:bg-destructive/20 p-0.5">
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
  allSubjects: Subject[];
}

const TeachersForm: React.FC<TeachersFormProps> = ({ data: teachers, allSubjects }) => {
  const dispatch = useAppDispatch();
  const allClasses = useAppSelector(selectAllClasses);
  const { toast } = useToast();

  const subjectsWithTeachers = (() => {
    const map = new Map<number, { subject: Subject; teachers: TeacherWithDetails[] }>();
    teachers.forEach(teacher => {
      teacher.subjects.forEach(subject => {
        if (!map.has(subject.id)) {
          map.set(subject.id, { subject, teachers: [] });
        }
        map.get(subject.id)!.teachers.push(teacher);
      });
    });
    return Array.from(map.values());
  })();

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) {
        return;
    };

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

        {subjectsWithTeachers.map(({ subject, teachers: subjectTeachers }) => {
          const assignedClassIds = new Set(teachers.flatMap(t => t.classes.map(c => c.id)));
          const unassignedClasses = allClasses.filter(c => !assignedClassIds.has(c.id));

          return (
            <Card key={subject.id} className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <BookOpen className="text-primary" size={20} />
                <h3 className="text-lg font-semibold">Assignation pour : {subject.name}</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-1">
                  <h4 className="font-medium mb-2">Classes non assignées</h4>
                  <div className="p-4 border rounded-lg bg-background min-h-[200px] max-h-[400px] overflow-y-auto space-y-2">
                    {unassignedClasses.length > 0 ? unassignedClasses.map(cls => (
                      <DraggableClass key={cls.id} classData={cls} />
                    )) : <p className="text-sm text-muted-foreground text-center pt-8">Toutes les classes ont été assignées pour cette matière.</p>}
                  </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <h4 className="font-medium mb-2">Professeurs de {subject.name}</h4>
                    {subjectTeachers.map(teacher => (
                      <TeacherDropzone key={teacher.id} teacher={teacher} onUnassign={(classId) => handleUnassign(teacher.id, classId)}/>
                    ))}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </DndContext>
  );
};

export default TeachersForm;
