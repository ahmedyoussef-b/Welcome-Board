// src/components/schedule/ScheduleEditor.tsx
'use client';

import React, { useMemo, useState } from 'react';
import { DndContext, useSensor, useSensors, MouseSensor, TouchSensor, type DragEndEvent, type DragStartEvent, type DragCancelEvent } from '@dnd-kit/core';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { updateLessonSubject, addLesson, removeLesson, saveSchedule, updateLessonSlot, selectSchedule } from '@/lib/redux/features/schedule/scheduleSlice';
import { toast } from '@/hooks/use-toast';
import type { WizardData, Lesson, Subject, Day, TeacherWithDetails } from '@/types';
import { ScheduleSidebar } from './ScheduleSidebar';
import TimetableDisplay from './TimetableDisplay';
import { Button } from '../ui/button';
import { ArrowLeft, Loader2, Save, Users, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ScheduleEditorProps {
    wizardData: WizardData;
    scheduleData: Lesson[];
    onBackToWizard: () => void;
}

type SchedulableLesson = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>;

const formatUtcTime = (dateString: string | Date): string => {
    const date = new Date(dateString);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    return `${hours}:00`;
};


const ScheduleEditor: React.FC<ScheduleEditorProps> = ({ wizardData, scheduleData, onBackToWizard }) => {
    const dispatch = useAppDispatch();
    const sensors = useSensors(
        useSensor(MouseSensor, {
            activationConstraint: {
                distance: 10,
            },
        }),
        useSensor(TouchSensor, {
            activationConstraint: {
                delay: 250,
                tolerance: 5,
            },
        })
    );
    
    const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
    const [selectedClassId, setSelectedClassId] = useState<string>(wizardData.classes[0]?.id.toString() || '');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(wizardData.teachers[0]?.id || '');
    const [highlightedSlots, setHighlightedSlots] = useState<string[]>([]);
    const [activeDragColor, setActiveDragColor] = useState<string | null>(null);

    const schedule = useAppSelector(selectSchedule);
    const scheduleStatus = useAppSelector(state => state.schedule.status);

    const filteredSchedule = useMemo(() => {
        if (viewMode === 'class') {
            if (!selectedClassId) return [];
            return scheduleData.filter(lesson => lesson.classId === parseInt(selectedClassId, 10));
        } else { // teacher view
            if (!selectedTeacherId) return [];
            return scheduleData.filter(lesson => lesson.teacherId === selectedTeacherId);
        }
    }, [scheduleData, viewMode, selectedClassId, selectedTeacherId]);

    const getSubjectBgColor = (subjectId: number): string => {
        const subjectColors = ['bg-primary/20', 'bg-secondary/20', 'bg-accent/20', 'bg-chart-1/20', 'bg-chart-2/20', 'bg-chart-3/20', 'bg-chart-4/20', 'bg-chart-5/20'];
        const index = wizardData.subjects.findIndex((s: Subject) => s.id === subjectId);
        return subjectColors[index % subjectColors.length] || 'bg-muted';
    };

    const handleDragStart = (event: DragStartEvent) => {
        const { active } = event;
        const lesson = active.data.current?.lesson as Lesson | undefined;
        
        if (!lesson) {
            setHighlightedSlots([]);
            setActiveDragColor(null);
            return;
        }

        const availableSlots: string[] = [];
        const schoolDays = wizardData.school.schoolDays.map(d => d.toUpperCase() as Day);
        const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

        schoolDays.forEach(day => {
            timeSlots.forEach(time => {
                const slotId = `${day}-${time}`;
                const isOccupied = schedule.some(l => l.day === day && formatUtcTime(l.startTime) === time);
                if (isOccupied) return;

                const teacherIsBusy = schedule.some(
                    l => l.id !== lesson.id && l.teacherId === lesson.teacherId && l.day === day && formatUtcTime(l.startTime) === time
                );
                const classIsBusy = schedule.some(
                    l => l.id !== lesson.id && l.classId === lesson.classId && l.day === day && formatUtcTime(l.startTime) === time
                );
                
                if (!teacherIsBusy && !classIsBusy) {
                    availableSlots.push(slotId);
                }
            });
        });

        setHighlightedSlots(availableSlots);
        setActiveDragColor(getSubjectBgColor(lesson.subjectId));
    };

    const handleDragCancel = () => {
        setHighlightedSlots([]);
        setActiveDragColor(null);
    };

    const handleDragEnd = (event: DragEndEvent) => {
        setHighlightedSlots([]);
        setActiveDragColor(null);
        const { active, over } = event;

        if (!over) return;
        
        if (active.id.toString().startsWith('lesson-')) {
            if (over.id.toString().startsWith('empty-')) {
                const lessonId = parseInt(active.id.toString().replace('lesson-', ''));
                const [, newDay, newTime] = over.id.toString().split('-');

                const lessonToMove = scheduleData.find(l => l.id === lessonId);
                if (!lessonToMove) return;

                const teacherIsBusy = scheduleData.some(
                    l => l.id !== lessonId && l.teacherId === lessonToMove.teacherId && l.day === newDay && formatUtcTime(l.startTime).startsWith(newTime)
                );
                if (teacherIsBusy) {
                    toast({ variant: "destructive", title: "Conflit d'horaire", description: `L'enseignant(e) est déjà occupé(e) sur ce créneau.` });
                    return;
                }

                const classIsBusy = scheduleData.some(
                    l => l.id !== lessonId && l.classId === lessonToMove.classId && l.day === newDay && formatUtcTime(l.startTime).startsWith(newTime)
                );
                if (classIsBusy) {
                    toast({ variant: "destructive", title: "Conflit d'horaire", description: `La classe a déjà un cours sur ce créneau.` });
                    return;
                }

                dispatch(updateLessonSlot({ lessonId, newDay: newDay as Day, newTime }));
                toast({ title: "Cours déplacé", description: `Le cours a été déplacé avec succès.` });
            }
            return; 
        }

        if (active.id.toString().startsWith('subject-')) {
            const subjectIdStr = active.id.toString().replace('subject-', '');
            const subjectId = parseInt(subjectIdStr, 10);
            if (isNaN(subjectId)) return;
            
            const subject = wizardData.subjects.find(s => s.id === subjectId);
            if (!subject) return;

            if (over.id.toString().startsWith('lesson-')) {
                const lessonIdStr = over.id.toString().replace('lesson-', '');
                const lessonId = parseInt(lessonIdStr, 10);
                const lesson = scheduleData.find(l => l.id === lessonId);
                const teacher = wizardData.teachers.find(t => t.id === lesson?.teacherId);

                if (teacher && teacher.subjects.some((s: Subject) => s.id === subjectId)) {
                    dispatch(updateLessonSubject({ lessonId, newSubjectId: subjectId }));
                    toast({ title: "Cours mis à jour", description: `La matière a été modifiée avec succès.` });
                } else {
                     toast({ variant: "destructive", title: "Assignation impossible", description: `L'enseignant(e) n'enseigne pas cette matière.` });
                }
            }
            else if (over.id.toString().startsWith('empty-')) {
                 if (viewMode === 'teacher') {
                    toast({
                        variant: "destructive",
                        title: "Action non prise en charge",
                        description: `Veuillez passer en vue "Par Classe" pour ajouter un nouveau cours.`
                    });
                    return;
                }
                if (!selectedClassId) return;

                const [, day, time] = over.id.toString().split('-');
                const [hour, minute] = time.split(':').map(Number);

                const potentialTeachers = wizardData.teachers.filter(t => 
                    t.subjects.some(s => s.id === subjectId) &&
                    (t.classes.length === 0 || t.classes.some(c => c.id === parseInt(selectedClassId, 10)))
                );

                if (potentialTeachers.length === 0) {
                    toast({ variant: "destructive", title: "Assignation impossible", description: `Aucun enseignant disponible pour enseigner "${subject.name}" à cette classe.` });
                    return;
                }
                
                const teacher = potentialTeachers[0];

                const newLesson: SchedulableLesson = {
                    name: `${subject.name} - ${wizardData.classes.find(c => c.id === parseInt(selectedClassId, 10))?.name}`,
                    day: day as Day,
                    startTime: new Date(2000, 0, 1, hour, minute).toISOString(),
                    endTime: new Date(2000, 0, 1, hour + 1, minute).toISOString(),
                    subjectId: subjectId,
                    classId: parseInt(selectedClassId, 10),
                    teacherId: teacher.id,
                    classroomId: null,
                };
                
                dispatch(addLesson(newLesson));
                toast({ title: "Cours ajouté", description: `"${subject.name}" a été ajouté à l'emploi du temps.` });
            }
        }
    };

    const handleDeleteLesson = (lessonId: number) => {
        dispatch(removeLesson(lessonId));
        toast({ title: "Cours supprimé", description: `Le cours a été retiré de l'emploi du temps.` });
    };

    const handleSaveChanges = async () => {
        const result = await dispatch(saveSchedule(scheduleData as SchedulableLesson[]));
        if(saveSchedule.fulfilled.match(result)){
            toast({ title: "Succès", description: "L'emploi du temps a été sauvegardé avec succès." });
        } else {
            toast({ variant: "destructive", title: "Erreur de sauvegarde", description: (result.payload as string) || "Une erreur inconnue est survenue." });
        }
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd} onDragCancel={handleDragCancel}>
            <div className="flex flex-col md:flex-row gap-6">
                 <div className="w-full md:w-1/4 lg:w-1/5 space-y-4">
                    <ScheduleSidebar subjects={wizardData.subjects} />
                     <Button onClick={onBackToWizard} variant="outline" className="w-full">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Retour à l'assistant
                    </Button>
                    <Button onClick={handleSaveChanges} className="w-full" disabled={scheduleStatus === 'loading'}>
                        {scheduleStatus === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {scheduleStatus === 'loading' ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
                    </Button>
                </div>
                <div className="flex-1">
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="class"><Users className="mr-2 h-4 w-4" />Par Classe</TabsTrigger>
                            <TabsTrigger value="teacher"><User className="mr-2 h-4 w-4" />Par Professeur</TabsTrigger>
                        </TabsList>
                        <TabsContent value="class" className="mt-4">
                            <Label>Afficher l'emploi du temps pour :</Label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={wizardData.classes.length === 0}>
                                <SelectTrigger className="w-full md:w-72 mt-1">
                                    <SelectValue placeholder="Sélectionner une classe" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wizardData.classes.map(cls => (
                                        <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </TabsContent>
                            <TabsContent value="teacher" className="mt-4">
                            <Label>Afficher l'emploi du temps pour :</Label>
                            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId} disabled={wizardData.teachers.length === 0}>
                                <SelectTrigger className="w-full md:w-72 mt-1">
                                    <SelectValue placeholder="Sélectionner un enseignant" />
                                </SelectTrigger>
                                <SelectContent>
                                    {wizardData.teachers.map(teacher => (
                                        <SelectItem key={teacher.id} value={String(teacher.id)}>{teacher.name} {teacher.surname}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </TabsContent>
                    </Tabs>
                    <TimetableDisplay 
                        wizardData={wizardData} 
                        scheduleData={filteredSchedule}
                        isEditable={true} 
                        onDeleteLesson={handleDeleteLesson}
                        isDropDisabled={viewMode === 'teacher'}
                        highlightedSlots={highlightedSlots}
                        activeDragColor={activeDragColor}
                    />
                </div>
            </div>
        </DndContext>
    );
};

export default ScheduleEditor;
