// src/components/wizard/ShuddleInitializer.tsx
'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { setAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { setAllSubjects } from '@/lib/redux/features/subjects/subjectsSlice';
import { setAllTeachers } from '@/lib/redux/features/teachers/teachersSlice';
import { setAllClassrooms } from '@/lib/redux/features/classrooms/classroomsSlice';
import { setInitialSchedule } from '@/lib/redux/features/schedule/scheduleSlice';
import { setAllGrades } from '@/lib/redux/features/grades/gradesSlice';
import { setAllRequirements } from '@/lib/redux/features/lessonRequirements/lessonRequirementsSlice';
import ShuddlePageClient from './ShuddlePageClient';
import type { ClassWithGrade, Subject, TeacherWithDetails, Classroom, Lesson, Grade, LessonRequirement } from '@/types';

interface ShuddleInitializerProps {
    initialData: {
        classes: ClassWithGrade[];
        subjects: Subject[];
        teachers: TeacherWithDetails[];
        classrooms: Classroom[];
        lessons: Lesson[];
        grades: Grade[];
        lessonRequirements: LessonRequirement[];
    };
}

export default function ShuddleInitializer({ initialData }: ShuddleInitializerProps) {
    const dispatch = useAppDispatch();

    useEffect(() => {
        dispatch(setAllClasses(initialData.classes));
        dispatch(setAllSubjects(initialData.subjects));
        dispatch(setAllTeachers(initialData.teachers));
        dispatch(setAllClassrooms(initialData.classrooms));
        dispatch(setInitialSchedule(initialData.lessons));
        dispatch(setAllGrades(initialData.grades));
        dispatch(setAllRequirements(initialData.lessonRequirements));
    }, [dispatch, initialData]);

    return <ShuddlePageClient />;
}
