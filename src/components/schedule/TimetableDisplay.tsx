// src/components/schedule/TimetableDisplay.tsx
'use client';

import React, { useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Printer, Trash2 } from 'lucide-react';
import type { WizardData, Lesson, Subject } from '@/types';
import { Day } from '@prisma/client';
import { useDroppable } from '@dnd-kit/core';

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
    
    // Sort lessons within each day
    for (const day of dayOrder) {
        if (lessonsByDay[day]) {
            lessonsByDay[day]!.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
        }
    }

    const finalMergedLessons: Lesson[] = [];
    
    // Process each day independently
    for (const day of dayOrder) {
        const dailyLessons = lessonsByDay[day] || [];
        if (dailyLessons.length === 0) continue;

        const mergedDailyLessons: Lesson[] = [];
        let i = 0;
        while (i < dailyLessons.length) {
            let currentLesson = { ...dailyLessons[i] }; // Create a mutable copy
            let j = i + 1;
            
            // Look for consecutive lessons with the same properties
            while (
                j < dailyLessons.length &&
                dailyLessons[j].classId === currentLesson.classId &&
                dailyLessons[j].subjectId === currentLesson.subjectId &&
                dailyLessons[j].teacherId === currentLesson.teacherId &&
                new Date(dailyLessons[j].startTime).getTime() === new Date(currentLesson.endTime).getTime()
            ) {
                // Merge by extending the end time
                currentLesson.endTime = dailyLessons[j].endTime;
                j++;
            }
            
            mergedDailyLessons.push(currentLesson);
            i = j; // Move to the next lesson that wasn't merged
        }
        finalMergedLessons.push(...mergedDailyLessons);
    }
    
    return finalMergedLessons;
};


// --- Internal Components ---

const DroppableLesson = ({ lesson, wizardData, onDelete, isEditable }: { lesson: Lesson; wizardData: WizardData; onDelete: (id: number) => void; isEditable: boolean }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `lesson-${lesson.id}`,
        data: { lesson }
    });

    const getSubjectName = (id: number) => wizardData.subjects.find(s => s.id === id)?.name || 'N/A';
    const getTeacherName = (id: string) => {
        const teacher = wizardData.teachers.find(t => t.id === id);
        return teacher ? `${teacher.name.charAt(0)}. ${teacher.surname}` : 'N/A';
    };
    const getClassName = (id: number) => wizardData.classes.find(c => c.id === id)?.name || 'N/A';

    const subjectColors = ['bg-primary/10 border-primary/20', 'bg-secondary/10 border-secondary/20', 'bg-accent/10 border-accent/20', 'bg-chart-1/20 border-chart-1/30', 'bg-chart-2/20 border-chart-2/30', 'bg-chart-3/20 border-chart-3/30', 'bg-chart-4/20 border-chart-4/30', 'bg-chart-5/20 border-chart-5/30'];
    const getSubjectColor = (subjectId: number) => {
      const index = wizardData.subjects.findIndex((s: Subject) => s.id === subjectId);
      return subjectColors[index % subjectColors.length];
    };
    
    return (
        <div ref={setNodeRef} className={`p-2 rounded-md border text-xs h-full flex flex-col justify-center transition-colors relative group ${getSubjectColor(lesson.subjectId)} ${isOver ? 'ring-2 ring-primary' : ''}`}>
             {isEditable && (
                <button
                    onClick={() => onDelete(lesson.id)}
                    className="absolute top-0 right-0 p-0.5 bg-destructive/80 text-destructive-foreground rounded-bl-md opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Supprimer ce cours"
                >
                    <Trash2 className="h-3 w-3" />
                </button>
            )}
            <div className="font-semibold text-foreground">{getSubjectName(lesson.subjectId)}</div>
            <div className="text-xs text-muted-foreground">{getTeacherName(lesson.teacherId)}</div>
            <div className="text-xs text-muted-foreground">Cl: {getClassName(lesson.classId)}</div>
        </div>
    );
};

const DroppableEmptyCell = ({ day, timeSlot, disabled }: { day: Day, timeSlot: string, disabled?: boolean }) => {
    const { isOver, setNodeRef } = useDroppable({
        id: `empty-${day}-${timeSlot}`,
        disabled,
    });

    return (
        <div 
            ref={setNodeRef}
            className={`h-16 w-full rounded-md transition-colors ${isOver ? 'bg-primary/20' : ''}`}
        >
        </div>
    );
};

// --- Main Timetable Display Component ---
interface TimetableDisplayProps {
  wizardData: WizardData;
  scheduleData: Lesson[];
  isEditable?: boolean;
  onDeleteLesson?: (lessonId: number) => void;
  isDropDisabled?: boolean;
}

const TimetableDisplay: React.FC<TimetableDisplayProps> = ({ wizardData, scheduleData, isEditable = false, onDeleteLesson = () => {}, isDropDisabled = false }) => {
  const schoolDays = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
  const dayMapping: { [key: string]: Day } = { Lundi: 'MONDAY', Mardi: 'TUESDAY', Mercredi: 'WEDNESDAY', Jeudi: 'THURSDAY', Vendredi: 'FRIDAY', Samedi: 'SATURDAY' };

  const formatUtcTime = (dateString: string | Date): string => {
    const date = new Date(dateString);
    const hours = String(date.getUTCHours()).padStart(2, '0');
    return `${hours}:00`;
  };

  const scheduleGrid = useMemo(() => {
    const mergedLessons = mergeConsecutiveLessons(scheduleData, wizardData);
    const grid: { [key: string]: Lesson[] } = {};
    mergedLessons.forEach((lesson) => {
      const day = lesson.day;
      const time = formatUtcTime(lesson.startTime);
      const cellId = `${day}-${time}`;
      if (!grid[cellId]) {
        grid[cellId] = [];
      }
      grid[cellId].push(lesson);
    });
    return grid;
  }, [scheduleData, wizardData]);
  
  const exportToPDF = () => { window.print(); };

  // Logic to handle multi-hour lessons
  const occupiedSlots = new Set<string>();

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
              {timeSlots.map((time, timeIndex) => (
                <TableRow key={time}>
                  <TableCell className="font-medium bg-muted/50 border">{time}</TableCell>
                  {schoolDays.map(day => {
                    const dayEnum = dayMapping[day];
                    const cellId = `${dayEnum}-${time}`;

                    if (occupiedSlots.has(cellId)) {
                        return null; // This cell is covered by a rowSpan from a previous row
                    }

                    const lessonsInSlot = scheduleGrid[cellId] || [];
                    
                    if (lessonsInSlot.length > 0) {
                        const lesson = lessonsInSlot[0];
                        
                        const startTime = new Date(lesson.startTime);
                        const endTime = new Date(lesson.endTime);
                        const durationInMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
                        const rowSpan = Math.max(1, Math.round(durationInMinutes / 60));

                        if (rowSpan > 1) {
                            for (let i = 1; i < rowSpan; i++) {
                                const nextTimeSlotIndex = timeSlots.indexOf(time) + i;
                                if (nextTimeSlotIndex < timeSlots.length) {
                                  const nextTimeSlot = timeSlots[nextTimeSlotIndex];
                                  occupiedSlots.add(`${dayEnum}-${nextTimeSlot}`);
                                }
                            }
                        }
                        
                        return (
                          <TableCell key={cellId} rowSpan={rowSpan} className="p-1 border align-top">
                             <DroppableLesson lesson={lesson} wizardData={wizardData} onDelete={onDeleteLesson} isEditable={isEditable} />
                          </TableCell>
                        );
                    } else {
                        return (
                            <TableCell key={cellId} className="p-1 border align-top">
                                {isEditable ? (
                                    <DroppableEmptyCell day={dayEnum} timeSlot={time} disabled={isDropDisabled} />
                                ) : (
                                    <div className="h-16 w-full"></div>
                                )}
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
