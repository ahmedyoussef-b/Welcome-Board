// src/types/index.ts

// Re-export all types and enums from prisma for other files to use
export * from "@prisma/client";

// Import specific types needed within this file for custom type definitions
import type {
    User as PrismaUser,
    Admin as PrismaAdmin,
    Teacher as PrismaTeacher,
    Student as PrismaStudent,
    Parent as PrismaParent,
    Announcement as PrismaAnnouncement,
    Session as PrismaSession,
    RefreshToken as PrismaRefreshToken,
    Role as PrismaRoleEnumValue,
    Class as PrismaClass,
    Subject as PrismaSubject,
    Classroom as PrismaClassroom,
    Grade as PrismaGrade,
    Lesson as PrismaLesson,
    Exam as PrismaExam,
    Assignment as PrismaAssignment,
    Event as PrismaEvent
} from "@prisma/client";
import { Day } from "@prisma/client";


// Types sécurisés (sans données sensibles)
export type SafeUser = Omit<PrismaUser, 'password'>;
export type SafeAdmin = PrismaAdmin & { user: SafeUser };
export type SafeTeacher = PrismaTeacher & { user: SafeUser };
export type SafeStudent = PrismaStudent & { user: SafeUser };
export type SafeParent = PrismaParent & { user: SafeUser };


// Types étendus avec relations
export type UserWithRelations = PrismaUser & {
    admin: PrismaAdmin | null;
    teacher: PrismaTeacher | null;
    student: PrismaStudent | null;
    parent: PrismaParent | null;
    sessions: PrismaSession[];
    refreshTokens: PrismaRefreshToken[];
};

export type TeacherWithDetails = PrismaTeacher & {
    user: PrismaUser | null;
    subjects: PrismaSubject[];
    classes: PrismaClass[];
    lessons?: PrismaLesson[];
    _count: {
        classes: number;
        subjects: number;
        lessons?: number;
    };
};

export type StudentWithDetails = PrismaStudent & {
  user: PrismaUser | null;
  class: (PrismaClass & {
    _count: {
      select: { lessons: true }
    };
  }) | null;
  parent: PrismaParent | null;
  grade: PrismaGrade | null;
};

export type LessonWithDetails = PrismaLesson & {
  subject: PrismaSubject;
  class: PrismaClass;
  teacher: PrismaTeacher & {
      user: PrismaUser | null;
  };
  exams: PrismaExam[];
  assignments: PrismaAssignment[];
};

export type EventWithClass = PrismaEvent & {
  class: { name: string } | null;
};

export type AnnouncementWithClass = PrismaAnnouncement & {
  class: { name: string } | null;
};

export type ClassWithGrade = PrismaClass & {
  grade: PrismaGrade;
};

// Types pour les payloads d'API et le wizard
export interface LessonRequirement {
  classId: number;
  subjectId: number;
  hours: number;
}

export interface TeacherConstraint {
  id: string;
  teacherId: string;
  day: Day;
  startTime: string;
  endTime: string;
  description: string;
}

export interface SubjectRequirement {
    subjectId: number;
    requiredRoomId: number | 'any';
    timePreference: 'ANY' | 'AM' | 'PM';
}

export interface SchoolData {
  name: string;
  startTime: string;
  endTime: string;
  schoolDays: string[];
  sessionDuration: number;
}

export interface WizardData {
  school: SchoolData;
  classes: ClassWithGrade[];
  subjects: PrismaSubject[];
  teachers: TeacherWithDetails[];
  rooms: PrismaClassroom[];
  lessonRequirements: LessonRequirement[];
  teacherConstraints?: TeacherConstraint[];
  subjectRequirements?: SubjectRequirement[];
}

export type CreateSubjectPayload = {
  name: string;
  weeklyHours: number;
  coefficient?: number;
};

export type CreateClassPayload = {
  name: string;
  abbreviation?: string;
  capacity: number;
  gradeLevel: number;
};

export type CreateClassroomPayload = {
  name: string;
  abbreviation?: string;
  capacity: number;
  building?: string;
};

export type CreateTeacherPayload = {
  name: string;
  surname: string;
  email: string;
  username: string;
  phone?: string;
  address?: string;
  subjects?: string[];
  classes?: string[];
};

// Types pour l'authentification
export interface AuthResponse {
  user: SafeUser;
  session: PrismaSession;
  refreshToken: PrismaRefreshToken;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  role: PrismaRoleEnumValue;
  name?: string;
}

// Types pour les payloads JWT
export interface JwtPayload {
  userId: string;
  role: PrismaRoleEnumValue;
  email: string;
  name?: string;
  iat: number;
  exp: number;
}
