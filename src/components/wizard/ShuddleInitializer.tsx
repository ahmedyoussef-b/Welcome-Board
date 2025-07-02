// src/components/wizard/ShuddleInitializer.tsx
'use client';

import { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { setAllClasses, selectAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { setAllSubjects, selectAllMatieres } from '@/lib/redux/features/subjects/subjectsSlice';
import { setAllTeachers, selectAllProfesseurs } from '@/lib/redux/features/teachers/teachersSlice';
import { setAllClassrooms, selectAllSalles } from '@/lib/redux/features/classrooms/classroomsSlice';
import { setInitialSchedule, selectSchedule } from '@/lib/redux/features/schedule/scheduleSlice';
import { setAllGrades, selectAllGrades } from '@/lib/redux/features/grades/gradesSlice';
import { setAllRequirements as setAllLessonRequirements, selectLessonRequirements } from '@/lib/redux/features/lessonRequirements/lessonRequirementsSlice';
import { setAllTeacherConstraints, selectTeacherConstraints } from '@/lib/redux/features/teacherConstraintsSlice';
import { setAllSubjectRequirements, selectSubjectRequirements } from '@/lib/redux/features/subjectRequirementsSlice';
import { setAllTeacherAssignments } from '@/lib/redux/features/teacherAssignmentsSlice';
import { setSchoolConfig } from '@/lib/redux/features/schoolConfigSlice';
import { Loader2 } from 'lucide-react';
import ShuddlePageClient from './ShuddlePageClient';
import type { ClassWithGrade, Subject, TeacherWithDetails, Classroom, Lesson, Grade, LessonRequirement, TeacherConstraint, SubjectRequirement } from '@/types';

interface ShuddleInitializerProps {
    initialData: {
        classes: ClassWithGrade[];
        subjects: Subject[];
        teachers: TeacherWithDetails[];
        classrooms: Classroom[];
        lessons: Lesson[];
        grades: Grade[];
        lessonRequirements: LessonRequirement[];
        teacherConstraints: TeacherConstraint[];
        subjectRequirements: SubjectRequirement[];
    };
}

export default function ShuddleInitializer({ initialData }: ShuddleInitializerProps) {
    const dispatch = useAppDispatch();
    const [isInitialized, setIsInitialized] = useState(false);

    // Use one selector to check if the store is likely populated from persistence
    const loadedClasses = useAppSelector(selectAllClasses);

    useEffect(() => {
        // Only initialize if the state is empty (i.e., no persisted state was loaded)
        // This prevents overwriting user's draft work on page reload.
        if (loadedClasses.length === 0 && initialData.classes.length > 0) {
            console.log("Initializing wizard state from server data...");
            dispatch(setAllClasses(initialData.classes));
            dispatch(setAllSubjects(initialData.subjects));
            dispatch(setAllTeachers(initialData.teachers));
            dispatch(setAllClassrooms(initialData.classrooms));
            dispatch(setInitialSchedule(initialData.lessons));
            dispatch(setAllGrades(initialData.grades));
            dispatch(setAllLessonRequirements(initialData.lessonRequirements));
            dispatch(setAllTeacherConstraints(initialData.teacherConstraints));
            dispatch(setAllSubjectRequirements(initialData.subjectRequirements));
            dispatch(setAllTeacherAssignments([])); // Start with fresh assignments
            dispatch(setSchoolConfig({ // Default school config
                name: 'Collège Riadh 5',
                startTime: '08:00',
                endTime: '17:00',
                schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                sessionDuration: 60,
            }));
        }
        setIsInitialized(true);
    }, [dispatch, initialData, loadedClasses]);

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Chargement du planificateur...</p>
            </div>
        );
    }

    return <ShuddlePageClient />;
}
