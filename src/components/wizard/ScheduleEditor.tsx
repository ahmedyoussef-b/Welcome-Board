// src/components/wizard/ScheduleEditor.tsx
'use client';

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { addLesson, removeLesson, saveSchedule, selectSchedule, selectScheduleStatus } from '@/lib/redux/features/schedule/scheduleSlice';
import { useToast } from '@/hooks/use-toast';
import type { WizardData, Lesson, Subject, Day, TeacherWithDetails, TeacherConstraint } from '@/types';
import { ScheduleSidebar } from '../schedule/ScheduleSidebar';
import TimetableDisplay from '../schedule/TimetableDisplay';
import { Button } from '../ui/button';
import { ArrowLeft, Loader2, Save, Users, User } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { findConflictingConstraint, calculateAvailableSlots } from '@/lib/schedule-utils';
import { toggleSelectedSubject, selectCurrentSubject } from '@/lib/redux/features/wizardSlice';

interface ScheduleEditorProps {
    wizardData: WizardData;
    onBackToWizard: () => void;
}

type SchedulableLesson = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>;

export default function ScheduleEditor({ wizardData, onBackToWizard }: ScheduleEditorProps) {
    const dispatch = useAppDispatch();
    const { toast } = useToast();

    // States from redux
    const schedule = useAppSelector(selectSchedule);
    const scheduleStatus = useAppSelector(selectScheduleStatus);
    const selectedSubject = useAppSelector(selectCurrentSubject);

    // Local states
    const [viewMode, setViewMode] = useState<'class' | 'teacher'>('class');
    const [selectedClassId, setSelectedClassId] = useState<string>(wizardData.classes[0]?.id.toString() || '');
    const [selectedTeacherId, setSelectedTeacherId] = useState<string>(wizardData.teachers[0]?.id || '');
    
    const filteredSchedule = useMemo(() => {
        if (viewMode === 'class') {
            if (!selectedClassId) return [];
            return schedule.filter(lesson => lesson.classId === parseInt(selectedClassId, 10));
        } else { // teacher view
            if (!selectedTeacherId) return [];
            return schedule.filter(lesson => lesson.teacherId === selectedTeacherId);
        }
    }, [schedule, viewMode, selectedClassId, selectedTeacherId]);

    const availableSlots = useMemo(() => {
        return calculateAvailableSlots(
            selectedSubject,
            selectedClassId,
            schedule,
            wizardData,
            viewMode
        );
    }, [selectedSubject, selectedClassId, schedule, wizardData, viewMode]);

    const handleDoubleClickOnSlot = useCallback((day: Day, time: string) => {
        if (!selectedSubject) {
            toast({ variant: 'destructive', title: 'Aucune matière sélectionnée', description: 'Veuillez d\'abord sélectionner une matière dans la barre latérale.' });
            return;
        }
        if (viewMode !== 'class' || !selectedClassId) {
            toast({ variant: 'destructive', title: 'Vue incorrecte', description: 'Veuillez passer en vue "Par Classe" pour ajouter un cours.' });
            return;
        }

        const [hour, minute] = time.split(':').map(Number);
        
        const potentialTeachers = wizardData.teachers.filter(t =>
            t.subjects.some(s => s.id === selectedSubject.id)
        );

        const availableTeacher = potentialTeachers.find(teacher => {
            const isTeacherBusy = schedule.some(l => l.teacherId === teacher.id && l.day === day && new Date(l.startTime).getUTCHours() === hour);
            const lessonEndTime = new Date(0, 0, 0, hour, minute + wizardData.school.sessionDuration);
            const lessonEndTimeStr = `${String(lessonEndTime.getUTCHours()).padStart(2, '0')}:${String(lessonEndTime.getUTCMinutes()).padStart(2, '0')}`;
            const constraint = findConflictingConstraint(teacher.id, day, time, lessonEndTimeStr, wizardData.teacherConstraints || []);
            return !isTeacherBusy && !constraint;
        });

        if (!availableTeacher) {
            toast({ variant: "destructive", title: "Aucun enseignant disponible", description: `Tous les professeurs compétents pour "${selectedSubject.name}" sont occupés ou ont une contrainte sur ce créneau.` });
            return;
        }

        let assignedRoomId: number | null = null;
        const availableRoom = wizardData.rooms.find(r => 
            !schedule.some(l => l.day === day && new Date(l.startTime).getUTCHours() === hour && l.classroomId === r.id)
        );
        assignedRoomId = availableRoom ? availableRoom.id : null;

        const newLesson: SchedulableLesson = {
            name: `${selectedSubject.name} - ${wizardData.classes.find(c => c.id === parseInt(selectedClassId, 10))?.name}`,
            day: day,
            startTime: new Date(Date.UTC(2000, 0, 1, hour, minute)).toISOString(),
            endTime: new Date(Date.UTC(2000, 0, 1, hour, minute + wizardData.school.sessionDuration)).toISOString(),
            subjectId: selectedSubject.id,
            classId: parseInt(selectedClassId, 10),
            teacherId: availableTeacher.id,
            classroomId: assignedRoomId,
        };

        dispatch(addLesson(newLesson));
        toast({ title: "Cours ajouté", description: `"${selectedSubject.name}" a été ajouté à l'emploi du temps.` });
        dispatch(toggleSelectedSubject(selectedSubject));
    }, [selectedSubject, selectedClassId, viewMode, wizardData, schedule, dispatch, toast]);

    const handleDeleteLesson = (lessonId: number) => {
        dispatch(removeLesson(lessonId));
        toast({ title: "Cours supprimé", description: `Le cours a été retiré de l'emploi du temps.` });
    };

    const handleSaveChanges = async () => {
        const result = await dispatch(saveSchedule(schedule as SchedulableLesson[]));
        if(saveSchedule.fulfilled.match(result)){
            toast({ title: "Succès", description: "L'emploi du temps a été sauvegardé avec succès." });
        } else {
            toast({ variant: "destructive", title: "Erreur de sauvegarde", description: (result.payload as string) || "Une erreur inconnue est survenue." });
        }
    };

    return (
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
                    fullSchedule={schedule}
                    isEditable={true} 
                    onDeleteLesson={handleDeleteLesson}
                    onEmptyCellDoubleClick={handleDoubleClickOnSlot}
                    selectedSubject={selectedSubject}
                    availableSlots={availableSlots}
                />
            </div>
        </div>
    );
};
