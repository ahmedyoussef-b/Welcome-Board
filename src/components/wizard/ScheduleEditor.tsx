// src/components/wizard/ScheduleEditor.tsx
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { DndContext, useSensor, useSensors, MouseSensor, TouchSensor, type DragEndEvent, type DragStartEvent } from '@dnd-kit/core';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { addLesson, removeLesson, saveSchedule, selectSchedule, selectScheduleStatus, updateLessonSlot, updateLessonSubject } from '@/lib/redux/features/schedule/scheduleSlice';
import { useToast } from '@/hooks/use-toast';
import type { WizardData, Lesson, Subject, Day, TeacherWithDetails } from '@/types';
import { ScheduleSidebar } from '../schedule/ScheduleSidebar';
import TimetableDisplay from '../schedule/TimetableDisplay';
import { Button } from '../ui/button';
import { ArrowLeft, Loader2, Save, Users, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { findConflictingConstraint } from '@/lib/schedule-utils';
import { toggleSelectedSubject, selectCurrentSubject } from '@/lib/redux/features/wizardSlice';

type SchedulableLesson = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>;
const formatTimeSimple = (date: string | Date): string => `${new Date(date).getUTCHours().toString().padStart(2, '0')}:00`;

export default function ScheduleEditor({ wizardData, onBackToWizard }: { wizardData: WizardData, onBackToWizard: () => void }) {
    const dispatch = useAppDispatch();
    const { toast } = useToast();
    const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

    const schedule = useAppSelector(selectSchedule);
    const scheduleStatus = useAppSelector(selectScheduleStatus);
    
    const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
    const [selectedClassId, setSelectedClassId] = useState<string>(wizardData.classes[0]?.id.toString() || '');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(wizardData.teachers[0]?.id || '');

    const filteredSchedule = useMemo(() => {
        if (viewMode === 'class' && selectedClassId) return schedule.filter(l => l.classId === parseInt(selectedClassId));
        if (viewMode === 'teacher' && selectedTeacherId) return schedule.filter(l => l.teacherId === selectedTeacherId);
        return [];
    }, [schedule, viewMode, selectedClassId, selectedTeacherId]);

    const handlePlaceLesson = useCallback((subject: Subject, day: Day, time: string) => {
        const { school, teachers, rooms, classes, teacherConstraints = [] } = wizardData;

        const [hour, minute] = time.split(':').map(Number);

        // Find an available teacher for this subject and slot
        const availableTeacher = teachers.find(teacher => {
            const canTeach = teacher.subjects.some(s => s.id === subject.id);
            if (!canTeach) return false;
            
            const isBusy = schedule.some(l => l.teacherId === teacher.id && l.day === day && formatTimeSimple(l.startTime) === time);
            if (isBusy) return false;
            
            const lessonEndTime = new Date(Date.UTC(0, 0, 1, hour, minute + school.sessionDuration));
            const lessonEndTimeStr = `${String(lessonEndTime.getUTCHours()).padStart(2, '0')}:${String(lessonEndTime.getUTCMinutes()).padStart(2, '0')}`;
            const constraint = findConflictingConstraint(teacher.id, day, time, lessonEndTimeStr, teacherConstraints);
            
            return !constraint;
        });

        if (!availableTeacher) {
            toast({ variant: "destructive", title: "Aucun enseignant disponible", description: `Aucun enseignant pour "${subject.name}" n'est libre sur ce créneau.` });
            return;
        }

        const occupiedRoomIds = schedule.filter(l => l.day === day && formatTimeSimple(l.startTime) === time).map(l => l.classroomId).filter((id): id is number => id !== null);
        const availableRoom = rooms.find(r => !occupiedRoomIds.includes(r.id));
        
        const newLesson: SchedulableLesson = {
            name: `${subject.name} - ${classes.find(c => c.id === parseInt(selectedClassId, 10))?.name}`,
            day: day,
            startTime: new Date(Date.UTC(2000, 0, 1, hour, minute)).toISOString(),
            endTime: new Date(Date.UTC(2000, 0, 1, hour, minute + school.sessionDuration)).toISOString(),
            subjectId: subject.id,
            classId: parseInt(selectedClassId, 10),
            teacherId: availableTeacher.id,
            classroomId: availableRoom ? availableRoom.id : null,
        };

        dispatch(addLesson(newLesson));
        toast({ title: "Cours ajouté", description: `"${subject.name}" a été ajouté à l'emploi du temps.` });

    }, [wizardData, schedule, selectedClassId, dispatch, toast]);

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over) return;
        
        if (active.id.toString().startsWith('lesson-') && over.id.toString().startsWith('empty-')) {
            const lessonId = parseInt(active.id.toString().replace('lesson-', ''));
            const [, newDay, newTime] = over.id.toString().split('-');
            dispatch(updateLessonSlot({ lessonId, newDay: newDay as Day, newTime }));
            toast({ title: "Cours déplacé" });
        } else if (active.id.toString().startsWith('subject-') && over.id.toString().startsWith('lesson-')) {
            const subjectId = parseInt(active.id.toString().replace('subject-', ''));
            const lessonId = parseInt(over.id.toString().replace('lesson-', ''));
            dispatch(updateLessonSubject({ lessonId, newSubjectId: subjectId }));
            toast({ title: "Matière modifiée" });
        } else if (active.id.toString().startsWith('subject-') && over.id.toString().startsWith('empty-')) {
            const subject = active.data.current?.subject as Subject;
            const [, day, time] = over.id.toString().split('-');
            if(subject){
                handlePlaceLesson(subject, day as Day, time);
            }
        }
    };

    const handleDeleteLesson = (lessonId: number) => dispatch(removeLesson(lessonId));
    const handleSaveChanges = () => dispatch(saveSchedule(schedule as SchedulableLesson[]));

    return (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/4 lg:w-1/5 space-y-4">
                    <ScheduleSidebar subjects={wizardData.subjects} />
                    <Button onClick={onBackToWizard} variant="outline" className="w-full"><ArrowLeft className="mr-2 h-4 w-4" />Retour</Button>
                    <Button onClick={handleSaveChanges} className="w-full" disabled={scheduleStatus === 'loading'}>
                        {scheduleStatus === 'loading' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Sauvegarder
                    </Button>
                </div>
                <div className="flex-1">
                    <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as any)} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="class"><Users className="mr-2 h-4 w-4" />Par Classe</TabsTrigger>
                            <TabsTrigger value="teacher"><User className="mr-2 h-4 w-4" />Par Professeur</TabsTrigger>
                        </TabsList>
                        <TabsContent value="class" className="mt-4">
                            <Label>Classe :</Label>
                            <Select value={selectedClassId} onValueChange={setSelectedClassId}>
                                <SelectTrigger className="w-full md:w-72 mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>{wizardData.classes.map(cls => <SelectItem key={cls.id} value={String(cls.id)}>{cls.name}</SelectItem>)}</SelectContent>
                            </Select>
                        </TabsContent>
                        <TabsContent value="teacher" className="mt-4">
                            <Label>Professeur :</Label>
                            <Select value={selectedTeacherId} onValueChange={setSelectedTeacherId}>
                                <SelectTrigger className="w-full md:w-72 mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>{wizardData.teachers.map(t => <SelectItem key={t.id} value={t.id}>{t.name} {t.surname}</SelectItem>)}</SelectContent>
                            </Select>
                        </TabsContent>
                    </Tabs>
                    <TimetableDisplay 
                        wizardData={wizardData} 
                        scheduleData={filteredSchedule}
                        fullSchedule={schedule}
                        isEditable={true} 
                        onDeleteLesson={handleDeleteLesson}
                        onAddLesson={handlePlaceLesson}
                        viewMode={viewMode}
                        selectedViewId={viewMode === 'class' ? selectedClassId : selectedTeacherId}
                    />
                </div>
            </div>
        </DndContext>
    );
}
