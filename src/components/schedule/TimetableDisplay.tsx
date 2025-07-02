// src/components/schedule/TimetableDisplay.tsx
'use client';

import React, { useMemo, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Printer, Trash2, Building } from 'lucide-react';
import type { WizardData, Lesson, Subject } from '@/types';
import { Day } from '@prisma/client';
import { useDroppable, useDraggable } from '@dnd-kit/core';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { updateLessonRoom } from '@/lib/redux/features/schedule/scheduleSlice';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { findConflictingConstraint } from '@/lib/schedule-utils';


const dayLabels: Record<Day, string> = { MONDAY: 'Lundi', TUESDAY: 'Mardi', WEDNESDAY: 'Mercredi', THURSDAY: 'Jeudi', FRIDAY: 'Vendredi', SATURDAY: 'Samedi', SUNDAY: 'Dimanche' };

// --- Helper Function to Merge Lessons ---
const mergeConsecutiveLessons = (lessons: Lesson[], wizardData: WizardData): Lesson[] => {
    if (!lessons || lessons.length === 0) return [];

    const dayOrder: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
    
    // Efficiently group lessons by day
    const lessonsByDay: { [key in Day]?: Lesson[] } = {};
    for (const lesson of lessons) {
        if (!lessonsByDay[lesson.day]) {
            lessonsByDay[lesson.day] = [];
        }
        lessonsByDay[lesson.day]!.push(lesson);
    }
    
    const finalMergedLessons: Lesson[] = [];
    
    // Process each day independently
    for (const day of dayOrder) {
        const dailyLessons = lessonsByDay[day];
        if (!dailyLessons || dailyLessons.length === 0) continue;

        // Sort a *copy* of the lessons for that day to avoid mutating the original data
        const sortedDailyLessons = [...dailyLessons].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        
        const mergedDailyLessons: Lesson[] = [];
        let i = 0;
        while (i < sortedDailyLessons.length) {
            let currentLesson = { ...sortedDailyLessons[i] }; // Create a mutable copy
            let j = i + 1;
            
            // Look for consecutive lessons with the same properties
            while (
                j < sortedDailyLessons.length &&
                sortedDailyLessons[j].classId === currentLesson.classId &&
                sortedDailyLessons[j].subjectId === currentLesson.subjectId &&
                sortedDailyLessons[j].teacherId === currentLesson.teacherId &&
                new Date(sortedDailyLessons[j].startTime).getTime() === new Date(currentLesson.endTime).getTime()
            ) {
                // Merge by extending the end time
                currentLesson.endTime = sortedDailyLessons[j].endTime;
                j++;
            }
            
            mergedDailyLessons.push(currentLesson);
            i = j; // Move to the next lesson that wasn't merged
        }
        finalMergedLessons.push(...mergedDailyLessons);
    }
    
    return finalMergedLessons;
};


const formatUtcTime = (dateString: string | Date): string => {
    const date = new Date(dateString);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
};


// --- Internal Components ---
const RoomSelectorPopover: React.FC<{
  lesson: Lesson | null;
  day: Day;
  timeSlot: string;
  wizardData: WizardData;
  fullSchedule: Lesson[];
}> = ({ lesson, day, timeSlot, wizardData, fullSchedule }) => {
    const dispatch = useAppDispatch();
    const [isOpen, setIsOpen] = useState(false);

    const occupiedRoomIds = useMemo(() => {
        const [hour, minute] = timeSlot.split(':').map(Number);
        const checkTime = new Date(Date.UTC(1970, 0, 1, hour, minute)).getTime();
        
        return fullSchedule
            .filter(l => {
                if (lesson && l.id === lesson.id) return false;

                const lessonStart = new Date(l.startTime);
                const lessonStartTime = new Date(0);
                lessonStartTime.setUTCHours(lessonStart.getUTCHours(), lessonStart.getUTCMinutes(), 0, 0);

                return l.day === day &&
                       lessonStartTime.getTime() === checkTime &&
                       l.classroomId != null;
            })
            .map(l => l.classroomId) as number[];
    }, [day, timeSlot, fullSchedule, lesson]);

    const availableRooms = (wizardData?.rooms || []).filter(room => !occupiedRoomIds.includes(room.id));
    
    const handleRoomChange = (newRoomId: number | null) => {
        if (!lesson) return;
        dispatch(updateLessonRoom({ lessonId: lesson.id, classroomId: newRoomId }));
        toast({ title: "Salle modifiée", description: `Le cours a été assigné à une nouvelle salle.` });
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                 <Button variant="ghost" size="icon" className="absolute top-1 right-1 p-0.5 h-6 w-6 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity" title="Changer de salle">
                    <Building size={14} />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-60">
                 <div className="space-y-2">
                    <h4 className="font-medium leading-none">Salles Disponibles</h4>
                    <p className="text-sm text-muted-foreground">
                        Créneau: {dayLabels[day]} {timeSlot}
                    </p>
                    <div className="space-y-1 max-h-48 overflow-y-auto">
                        {availableRooms.length > 0 ? availableRooms.map(room => (
                            <Button
                                key={room.id}
                                variant="outline"
                                size="sm"
                                className="w-full justify-start"
                                onClick={() => handleRoomChange(room.id)}
                                disabled={!lesson}
                            >
                                {room.name}
                            </Button>
                        )) : <p className="text-sm text-muted-foreground p-2">Aucune salle libre.</p>}
                        
                        {lesson?.classroomId && (
                             <Button
                                variant="destructive"
                                size="sm"
                                className="w-full justify-start mt-2"
                                onClick={() => handleRoomChange(null)}
                            >
                                Retirer la salle
                            </Button>
                        )}
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
};


const DraggableLesson = ({ lesson, wizardData, onDelete, isEditable, fullSchedule }: { lesson: Lesson; wizardData: WizardData; onDelete: (id: number) => void; isEditable: boolean; fullSchedule: Lesson[] }) => {
    const { attributes, listeners, setNodeRef: setDraggableNodeRef, transform, isDragging } = useDraggable({
        id: `lesson-${lesson.id}`,
        data: { lesson },
        disabled: !isEditable,
    });
    const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
        id: `lesson-${lesson.id}`,
        data: { lesson }
    });

    const setNodeRef = (node: HTMLElement | null) => {
        setDraggableNodeRef(node);
        setDroppableNodeRef(node);
    };

    const style = transform ? { 
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 10,
    } : undefined;

    const getSubjectName = (id: number) => wizardData.subjects.find(s => s.id === id)?.name || 'N/A';
    const getTeacherName = (id: string) => {
        const teacher = wizardData.teachers.find(t => t.id === id);
        return teacher ? `${teacher.name.charAt(0)}. ${teacher.surname}` : 'N/A';
    };
    const getClassName = (id: number) => wizardData.classes.find(c => c.id === id)?.name || 'N/A';
    const getRoomName = (id: number | null) => wizardData.rooms.find(r => r.id === id)?.abbreviation || wizardData.rooms.find(r => r.id === id)?.name || 'N/A';

    const subjectColors = ['bg-primary/10 border-primary/20', 'bg-secondary/10 border-secondary/20', 'bg-accent/10 border-accent/20', 'bg-chart-1/20 border-chart-1/30', 'bg-chart-2/20 border-chart-2/30', 'bg-chart-3/20 border-chart-3/30', 'bg-chart-4/20 border-chart-4/30', 'bg-chart-5/20 border-chart-5/30'];
    const getSubjectColor = (subjectId: number) => {
      const index = wizardData.subjects.findIndex((s: Subject) => s.id === subjectId);
      return subjectColors[index % subjectColors.length] || 'bg-muted';
    };
    
    return (
        <div ref={setNodeRef} style={style} {...listeners} {...attributes} className={cn(`absolute inset-1 p-2 rounded-md border text-xs flex flex-col justify-center transition-colors group cursor-grab`, getSubjectColor(lesson.subjectId), isOver && 'ring-2 ring-primary', isDragging && 'opacity-50 shadow-lg')}>
             {isEditable && (
                <>
                    <button
                        onClick={() => onDelete(lesson.id)}
                        className="absolute top-0 left-0 p-0.5 bg-destructive/80 text-destructive-foreground rounded-br-md opacity-0 group-hover:opacity-100 transition-opacity"
                        title="Supprimer ce cours"
                    >
                        <Trash2 className="h-3 w-3" />
                    </button>
                    <RoomSelectorPopover lesson={lesson} day={lesson.day} timeSlot={formatUtcTime(lesson.startTime)} wizardData={wizardData} fullSchedule={fullSchedule} />
                </>
            )}
            <div className="font-semibold text-foreground">{getSubjectName(lesson.subjectId)}</div>
            <div className="text-xs text-muted-foreground">{getTeacherName(lesson.teacherId)}</div>
            <div className="text-xs text-muted-foreground">Cl: {getClassName(lesson.classId)}</div>
            <div className="text-xs text-muted-foreground">Salle: {getRoomName(lesson.classroomId)}</div>
        </div>
    );
};

const DroppableEmptyCell = ({ day, timeSlot, onDoubleClick, isHighlighted, highlightColor }: { day: Day; timeSlot: string; onDoubleClick?: (day: Day, timeSlot: string) => void; isHighlighted?: boolean; highlightColor?: string | null; }) => {
    return (
        <div
            onDoubleClick={() => onDoubleClick?.(day, timeSlot)}
            className={cn(
                'h-24 w-full rounded-md transition-colors relative group p-1',
                isHighlighted 
                  ? `${highlightColor} border-2 border-dashed border-primary animate-subtle-pulse` 
                  : 'hover:bg-muted/50'
            )}
        >
        </div>
    );
};


// --- Main Timetable Display Component ---
interface TimetableDisplayProps {
  wizardData: WizardData;
  scheduleData: Lesson[];
  fullSchedule: Lesson[];
  isEditable?: boolean;
  onDeleteLesson?: (lessonId: number) => void;
  onEmptyCellDoubleClick?: (day: Day, timeSlot: string) => void;
  selectedSubject: Subject | null;
  viewMode: 'class' | 'teacher';
  selectedClassId: string;
}

const TimetableDisplay: React.FC<TimetableDisplayProps> = ({ 
    wizardData, 
    scheduleData, 
    fullSchedule,
    isEditable = false, 
    onDeleteLesson = () => {}, 
    onEmptyCellDoubleClick,
    selectedSubject,
    viewMode,
    selectedClassId
}) => {
  const schoolDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const timeSlots = useMemo(() => ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'], []);
  const dayMapping: { [key: string]: Day } = { Lundi: 'MONDAY', Mardi: 'TUESDAY', Mercredi: 'WEDNESDAY', Jeudi: 'THURSDAY', Vendredi: 'FRIDAY', Samedi: 'SATURDAY' };

  const { scheduleGrid, spannedSlots } = useMemo(() => {
    const mergedLessons = mergeConsecutiveLessons(scheduleData, wizardData);
    const grid: { [key: string]: { lesson: Lesson, rowSpan: number } } = {};
    const localSpannedSlots = new Set<string>();

    mergedLessons.forEach((lesson) => {
      const day = lesson.day;
      const time = formatUtcTime(lesson.startTime);
      const cellId = `${day}-${time}`;

      if (localSpannedSlots.has(cellId)) return;

      const startTime = new Date(lesson.startTime);
      const endTime = new Date(lesson.endTime);
      const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
      const rowSpan = Math.max(1, Math.round(durationInMinutes / 60));

      grid[cellId] = { lesson, rowSpan };

      if (rowSpan > 1) {
        for (let i = 1; i < rowSpan; i++) {
          const nextTimeSlotIndex = timeSlots.indexOf(time) + i;
          if (nextTimeSlotIndex < timeSlots.length) {
            const nextTimeSlot = timeSlots[nextTimeSlotIndex];
            localSpannedSlots.add(`${day}-${nextTimeSlot}`);
          }
        }
      }
    });
    return { scheduleGrid: grid, spannedSlots: localSpannedSlots };
  }, [scheduleData, wizardData, timeSlots]);
  
  const isSlotAvailable = useCallback((day: Day, time: string): boolean => {
    if (!selectedSubject || viewMode !== 'class' || !selectedClassId) {
        return false;
    }
    
    const potentialTeachers = wizardData.teachers.filter(t =>
        t.subjects.some(s => s.id === selectedSubject.id)
    );

    if (potentialTeachers.length === 0) return false;

    const isSlotOccupiedForClass = fullSchedule.some(l => l.classId === parseInt(selectedClassId) && l.day === day && formatUtcTime(l.startTime) === time);
                
    if (isSlotOccupiedForClass) return false;
    
    const isAnyTeacherAvailable = potentialTeachers.some(teacher => {
        const isTeacherBusy = fullSchedule.some(l => l.teacherId === teacher.id && l.day === day && formatUtcTime(l.startTime) === time);
        
        const [hour, minute] = time.split(':').map(Number);
        const lessonEndTime = new Date(0, 0, 0, hour, minute + wizardData.school.sessionDuration);
        const lessonEndTimeStr = `${String(lessonEndTime.getUTCHours()).padStart(2, '0')}:${String(lessonEndTime.getUTCMinutes()).padStart(2, '0')}`;
        
        const constraint = findConflictingConstraint(teacher.id, day, time, lessonEndTimeStr, wizardData.teacherConstraints || []);
        
        return !isTeacherBusy && !constraint;
    });

    return isAnyTeacherAvailable;
  }, [selectedSubject, viewMode, selectedClassId, wizardData, fullSchedule]);

  const getSubjectBgColor = useCallback((subjectId: number): string => {
    const subjectColors = ['bg-primary/20', 'bg-secondary/20', 'bg-accent/20', 'bg-chart-1/20', 'bg-chart-2/20', 'bg-chart-3/20', 'bg-chart-4/20', 'bg-chart-5/20'];
    const index = wizardData.subjects.findIndex((s: Subject) => s.id === subjectId);
    return subjectColors[index % subjectColors.length] || 'bg-muted';
  }, [wizardData.subjects]);

  const highlightColor = selectedSubject ? getSubjectBgColor(selectedSubject.id) : null;
  
  const exportToPDF = () => { window.print(); };

  return (
    <div className="space-y-6 mt-4">
       {!isEditable && (
        <Card className="p-6 print-hidden">
            <div className="flex justify-between items-center">
            <div>
                <h2 className="text-2xl font-bold text-foreground mb-2">
                Emplois du Temps - {wizardData.school.name}
                </h2>
                <p className="text-muted-foreground">
                    Consultez l'emploi du temps généré.
                </p>
            </div>
            <div className="flex space-x-3">
                <Button variant="outline" onClick={exportToPDF}><Printer size={16} className="mr-2" />Imprimer</Button>
                <Button variant="outline"><Download size={16} className="mr-2" />Export PDF</Button>
            </div>
            </div>
        </Card>
      )}

      <Card>
        <CardContent className="p-4">
          <Table className="min-w-full border-collapse">
            <TableHeader>
              <TableRow>
                <TableHead className="w-20 border">Horaires</TableHead>
                {schoolDays.map(day => <TableHead key={day} className="text-center border min-w-32">{day}</TableHead>)}
              </TableRow>
            </TableHeader>
            <TableBody>
              {timeSlots.map((time) => (
                <TableRow key={time}>
                  <TableCell className="font-medium bg-muted/50 border h-24">{time}</TableCell>
                  {schoolDays.map(day => {
                    const dayEnum = dayMapping[day];
                    const cellId = `${dayEnum}-${time}`;

                    if (spannedSlots.has(cellId)) {
                        return null; // This cell is covered by a rowSpan
                    }

                    const cellData = scheduleGrid[cellId];
                    
                    if (cellData) {
                        return (
                          <TableCell key={cellId} rowSpan={cellData.rowSpan} className="p-0 border align-top relative">
                             <DraggableLesson lesson={cellData.lesson} wizardData={wizardData} onDelete={onDeleteLesson} isEditable={isEditable} fullSchedule={fullSchedule}/>
                          </TableCell>
                        );
                    } else {
                        const isHighlighted = isSlotAvailable(dayEnum, time);
                        return (
                            <TableCell key={cellId} className="p-0 border align-top">
                                <DroppableEmptyCell
                                    day={dayEnum}
                                    timeSlot={time}
                                    onDoubleClick={onEmptyCellDoubleClick}
                                    isHighlighted={isHighlighted}
                                    highlightColor={highlightColor}
                                />
                            </TableCell>
                        );
                    }
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default TimetableDisplay;
