// src/lib/schedule-utils.ts
import type { WizardData, Day, TeacherConstraint } from '@/types';
import { type Lesson as PrismaLesson } from '@prisma/client';

type SchedulableLesson = Omit<PrismaLesson, 'id' | 'createdAt' | 'updatedAt'>;

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
    const schoolDays = wizardData.school.schoolDays.map(d => d.toUpperCase() as Day);
    if (schoolDays.length === 0) return [];
  
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    const labSubjectKeywords = ['physique', 'informatique', 'sciences', 'technique'];
    const occupancy: { [key: string]: boolean } = {}; // Tracks teacher, class, and room occupancy
  
    wizardData.classes.forEach(classItem => {
      wizardData.subjects.forEach(subject => {
        const requirement = wizardData.lessonRequirements.find(r => r.classId === classItem.id && r.subjectId === subject.id);
        const hoursToSchedule = requirement ? requirement.hours : (subject.weeklyHours || 0);
  
        const potentialTeachers = wizardData.teachers.filter(t => 
          t.subjects.some(s => s.id === subject.id) &&
          (t.classes.length === 0 || t.classes.some(c => c.id === classItem.id))
        );
  
        if (potentialTeachers.length > 0) {
          for (let i = 0; i < hoursToSchedule; i++) {
            let placed = false;
            const shuffledDays = [...schoolDays].sort(() => Math.random() - 0.5);
            const shuffledTimes = [...timeSlots].sort(() => Math.random() - 0.5);
  
            for (const day of shuffledDays) {
              for (const time of shuffledTimes) {
                // Find an available teacher and check if the class is free
                const availableTeacher = potentialTeachers.find(t => !occupancy[`teacher-${t.id}-${day}-${time}`]);
                const isClassAvailable = !occupancy[`class-${classItem.id}-${day}-${time}`];
  
                if (availableTeacher && isClassAvailable) {
                  // Determine the required room type based on subject
                  const subjectNameLower = subject.name.toLowerCase();
                  const isLabSubject = labSubjectKeywords.some(keyword => subjectNameLower.includes(keyword));
                  
                  let potentialRooms: typeof wizardData.rooms = [];
                  if (isLabSubject) {
                    const subjectKeyword = labSubjectKeywords.find(k => subjectNameLower.includes(k));
                    potentialRooms = wizardData.rooms.filter(r => r.name.toLowerCase().includes('labo') && r.name.toLowerCase().includes(subjectKeyword!));
                  } else {
                    potentialRooms = wizardData.rooms.filter(r => !r.name.toLowerCase().includes('labo'));
                  }
  
                  const availableRoom = potentialRooms.find(r => !occupancy[`room-${r.id}-${day}-${time}`]);
                  
                  // A room is only strictly necessary if rooms are configured.
                  if (availableRoom || wizardData.rooms.length === 0) {
                    const [hour, minute] = time.split(':').map(Number);
  
                    newSchedule.push({
                      name: `${subject.name} - ${classItem.name}`,
                      day: day,
                      startTime: new Date(2000, 0, 1, hour, minute).toISOString(),
                      endTime: new Date(2000, 0, 1, hour + 1, minute).toISOString(),
                      subjectId: subject.id,
                      teacherId: availableTeacher.id,
                      classId: classItem.id,
                      classroomId: availableRoom ? availableRoom.id : null,
                    });
  
                    // Update all occupancies
                    occupancy[`teacher-${availableTeacher.id}-${day}-${time}`] = true;
                    occupancy[`class-${classItem.id}-${day}-${time}`] = true;
                    if (availableRoom) {
                      occupancy[`room-${availableRoom.id}-${day}-${time}`] = true;
                    }
                    placed = true;
                  }
                }
                if (placed) break;
              }
              if (placed) break;
            }
          }
        }
      });
    });
    return newSchedule;
  };
