// src/lib/schedule-utils.ts
import type { WizardData, Day, TeacherConstraint, Subject, Lesson } from '@/types';
import { type Lesson as PrismaLesson } from '@prisma/client';

type SchedulableLesson = Omit<PrismaLesson, 'id' | 'createdAt' | 'updatedAt'>;

const formatTimeSimple = (date: string | Date): string => `${new Date(date).getUTCHours().toString().padStart(2, '0')}:00`;

export const findConflictingConstraint = (
    teacherId: string,
    day: Day,
    lessonStartTime: string, // 'HH:mm'
    lessonEndTime: string, // 'HH:mm'
    constraints: TeacherConstraint[]
): TeacherConstraint | null => {
    const lessonStartMinutes = parseInt(lessonStartTime.split(':')[0]) * 60 + parseInt(lessonStartTime.split(':')[1]);
    const lessonEndMinutes = parseInt(lessonEndTime.split(':')[0]) * 60 + parseInt(lessonEndTime.split(':')[1]);

    for (const constraint of constraints) {
        if (constraint.teacherId === teacherId && constraint.day === day) {
            const constraintStartMinutes = parseInt(constraint.startTime.split(':')[0]) * 60 + parseInt(constraint.startTime.split(':')[1]);
            const constraintEndMinutes = parseInt(constraint.endTime.split(':')[0]) * 60 + parseInt(constraint.endTime.split(':')[1]);

            // Check for overlap: (StartA < EndB) and (EndA > StartB)
            if (lessonStartMinutes < constraintEndMinutes && lessonEndMinutes > constraintStartMinutes) {
                return constraint; // Return the conflicting constraint
            }
        }
    }
    return null; // No conflicting constraints found
};


export const calculateAvailableSlots = (
    selectedSubject: Subject | null,
    selectedClassId: string,
    schedule: Lesson[],
    wizardData: WizardData,
    viewMode: 'class' | 'teacher'
): Set<string> => {
    const slots = new Set<string>();

    // --- Guards ---
    if (!selectedSubject || viewMode !== 'class' || !selectedClassId || !wizardData.school || !Array.isArray(wizardData.teachers)) {
        return slots;
    }

    const { school, teachers, teacherConstraints = [] } = wizardData;

    // --- Logic ---
    const schoolDays = school.schoolDays.map(d => d.toUpperCase() as Day);
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];

    const potentialTeachers = teachers.filter(t =>
        Array.isArray(t.subjects) && t.subjects.some(s => s.id === selectedSubject.id)
    );

    if (potentialTeachers.length === 0) {
        return slots;
    }

    schoolDays.forEach(day => {
        timeSlots.forEach(time => {
            const classIdNum = parseInt(selectedClassId, 10);
            if (isNaN(classIdNum)) return;

            const isSlotOccupiedForClass = schedule.some(l =>
                l.classId === classIdNum &&
                l.day === day &&
                formatTimeSimple(l.startTime) === time
            );

            if (isSlotOccupiedForClass) return;

            const isAnyTeacherAvailable = potentialTeachers.some(teacher => {
                const isTeacherBusy = schedule.some(l =>
                    l.teacherId === teacher.id &&
                    l.day === day &&
                    formatTimeSimple(l.startTime) === time
                );

                if (isTeacherBusy) return false;

                const [hour, minute] = time.split(':').map(Number);
                const lessonEndTime = new Date(0, 0, 0, hour, minute + school.sessionDuration);
                const lessonEndTimeStr = `${String(lessonEndTime.getUTCHours()).padStart(2, '0')}:${String(lessonEndTime.getUTCMinutes()).padStart(2, '0')}`;

                const constraint = findConflictingConstraint(
                    teacher.id,
                    day,
                    time,
                    lessonEndTimeStr,
                    teacherConstraints
                );

                return !constraint;
            });

            if (isAnyTeacherAvailable) {
                slots.add(`${day}-${time}`);
            }
        });
    });

    return slots;
};


export const mergeConsecutiveLessons = (lessons: PrismaLesson[], wizardData: WizardData): PrismaLesson[] => {
    if (!lessons || lessons.length === 0) return [];

    const dayOrder: Day[] = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

    // Efficiently group lessons by day
    const lessonsByDay: { [key in Day]?: PrismaLesson[] } = {};
    for (const lesson of lessons) {
        if (!lessonsByDay[lesson.day]) {
            lessonsByDay[lesson.day] = [];
        }
        lessonsByDay[lesson.day]!.push(lesson);
    }

    const finalMergedLessons: PrismaLesson[] = [];

    // Process each day independently
    for (const day of dayOrder) {
        const dailyLessons = lessonsByDay[day];
        if (!dailyLessons || dailyLessons.length === 0) continue;

        // Sort a *copy* of the lessons for that day to avoid mutating the original data
        const sortedDailyLessons = [...dailyLessons].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

        const mergedDailyLessons: PrismaLesson[] = [];
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


export const generateSchedule = (wizardData: WizardData): SchedulableLesson[] => {
    const newSchedule: SchedulableLesson[] = [];
    const { school, classes, subjects, teachers, rooms, lessonRequirements, teacherConstraints = [], subjectRequirements = [] } = wizardData;

    if (!school.schoolDays || school.schoolDays.length === 0) return [];

    const schoolDays = school.schoolDays.map(d => d.toUpperCase() as Day);
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    const occupancy: { [key: string]: boolean } = {};

    classes.forEach(classItem => {
        subjects.forEach(subject => {
            const requirement = lessonRequirements.find(r => r.classId === classItem.id && r.subjectId === subject.id);
            const hoursToSchedule = requirement ? requirement.hours : (subject.weeklyHours || 0);
            if (hoursToSchedule === 0) return;

            // Teachers are filtered based on subject competency only.
            const potentialTeachers = teachers.filter(t => t.subjects.some(s => s.id === subject.id));
            if (potentialTeachers.length === 0) return;

            const subjectReq = subjectRequirements.find(r => r.subjectId === subject.id);

            for (let i = 0; i < hoursToSchedule; i++) {
                let placed = false;
                const shuffledDays = [...schoolDays].sort(() => Math.random() - 0.5);

                // Apply time preference from subjectRequirements
                let applicableTimeSlots = [...timeSlots];
                if (subjectReq?.timePreference === 'AM') {
                    applicableTimeSlots = timeSlots.filter(t => parseInt(t.split(':')[0]) < 12);
                } else if (subjectReq?.timePreference === 'PM') {
                    applicableTimeSlots = timeSlots.filter(t => parseInt(t.split(':')[0]) >= 12);
                }
                const shuffledTimes = [...applicableTimeSlots].sort(() => Math.random() - 0.5);

                for (const day of shuffledDays) {
                    for (const time of shuffledTimes) {
                        if (occupancy[`class-${classItem.id}-${day}-${time}`]) continue;

                        const availableTeacher = potentialTeachers.find(t => !occupancy[`teacher-${t.id}-${day}-${time}`]);
                        if (!availableTeacher) continue;
                        
                        const [hour, minute] = time.split(':').map(Number);
                        const lessonEndTimeDate = new Date(Date.UTC(0, 0, 0, hour, minute + school.sessionDuration));
                        const lessonEndTimeStr = `${String(lessonEndTimeDate.getUTCHours()).padStart(2, '0')}:${String(lessonEndTimeDate.getUTCMinutes()).padStart(2, '0')}`;
                        const constraint = findConflictingConstraint(availableTeacher.id, day, time, lessonEndTimeStr, teacherConstraints);
                        if (constraint) continue;

                        // Apply room requirements
                        let potentialRooms = [...rooms];
                        if (subjectReq?.requiredRoomId && subjectReq.requiredRoomId !== 'any') {
                            potentialRooms = rooms.filter(r => r.id === subjectReq.requiredRoomId);
                        }
                        
                        // Find a room that meets capacity and availability
                        const availableRoom = potentialRooms.find(r =>
                            !occupancy[`room-${r.id}-${day}-${time}`] && r.capacity >= classItem.capacity
                        );

                        // If a specific room type is needed but none are free/big enough, skip.
                        if (potentialRooms.length > 0 && !availableRoom) continue;
                        // If a specific room type is required but doesn't exist, skip.
                        if (rooms.length > 0 && subjectReq?.requiredRoomId && potentialRooms.length === 0) continue;

                        newSchedule.push({
                            name: `${subject.name} - ${classItem.name}`,
                            day,
                            startTime: new Date(Date.UTC(2000, 0, 1, hour, minute)).toISOString(),
                            endTime: new Date(Date.UTC(0, 0, 1, hour, minute + school.sessionDuration)).toISOString(),
                            subjectId: subject.id,
                            teacherId: availableTeacher.id,
                            classId: classItem.id,
                            classroomId: availableRoom ? availableRoom.id : null,
                        });

                        occupancy[`teacher-${availableTeacher.id}-${day}-${time}`] = true;
                        occupancy[`class-${classItem.id}-${day}-${time}`] = true;
                        if (availableRoom) {
                            occupancy[`room-${availableRoom.id}-${day}-${time}`] = true;
                        }
                        placed = true;
                        break;
                    }
                    if (placed) break;
                }
            }
        });
    });
    return newSchedule;
};
