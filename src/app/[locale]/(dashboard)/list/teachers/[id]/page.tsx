// src/app/[locale]/(dashboard)/list/teachers/[id]/page.tsx
import Announcements from "@/components/Announcements";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-utils";
import { type TeacherWithDetails, type WizardData, type ClassWithGrade, type Subject, type Classroom, type Lesson } from "@/types/index";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {Role } from "@prisma/client";
import DynamicAvatar from "@/components/DynamicAvatar";
import TimetableDisplay from "@/components/schedule/TimetableDisplay";

const SingleTeacherPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  const id = params.id;
  const locale = 'fr'; // Locale fixe

  const session = await getServerSession();
  const userRole = session?.role as Role | undefined;
  const currentUserId = session?.userId;

  if (!session) redirect(`/${locale}/login`);

  if (userRole !== Role.ADMIN && (userRole !== Role.TEACHER || currentUserId !== id)) {
    redirect(session ? `/${locale}/${session.role.toLowerCase()}` : `/${locale}/login`);
  }

  const teacher: Omit<TeacherWithDetails, 'lessons'> & { lessons?: Lesson[] } | null =
    await prisma.teacher.findUnique({
      where: { id },
      include: {
        user: true,
        subjects: true,
        classes: true,
        _count: {
          select: {
            classes: true,
            subjects: true,
          }
        }
      },
  });

  if (!teacher) {
    return notFound();
  }

  // --- REFACTORED DATA FETCHING ---

  // 1. Fetch only the lessons for this teacher to get class IDs and for the schedule display
  const lessons = await prisma.lesson.findMany({
    where: { teacherId: id },
    select: {
      id: true,
      name: true,
      day: true,
      startTime: true,
      endTime: true,
      subjectId: true,
      classId: true,
      teacherId: true,
      classroomId: true,
      subject: { select: { name: true } },
      class: { select: { name: true } },
    },
  });
  
  // 2. Extract unique class IDs from the lessons
  const classIds = [...new Set(lessons.map(l => l.classId))];

  // 3. Fetch only the classes this teacher teaches in, with their grades
  const teacherClasses = await prisma.class.findMany({
    where: { id: { in: classIds } },
    include: { grade: true },
  }) as ClassWithGrade[];

  // 4. Fetch all subjects and classrooms for context mapping
  const [allSubjects, allClassrooms] = await Promise.all([
    prisma.subject.findMany(),
    prisma.classroom.findMany(),
  ]);

  // 5. Construct wizardData with filtered data
  const wizardData: WizardData = {
    school: {
      name: `Emploi du temps de ${teacher.name} ${teacher.surname}`,
      startTime: '08:00',
      endTime: '17:00',
      schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      sessionDuration: 60,
    },
    classes: teacherClasses, // Use the explicitly filtered classes
    subjects: allSubjects as Subject[],
    teachers: [teacher] as TeacherWithDetails[], // Only this teacher
    rooms: allClassrooms as Classroom[],
  };

  // --- END REFACTORED DATA FETCHING ---

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3 flex items-center justify-center">
              <div className="w-36 h-36 flex items-center justify-center overflow-hidden rounded-full bg-muted">
                <DynamicAvatar 
                  imageUrl={teacher.user?.img || teacher.img}
                  seed={teacher.id || teacher.user?.email || Math.random().toString(36).substring(7)} 
                />
              </div>
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {teacher.name} {teacher.surname}
                </h1>
                {userRole === Role.ADMIN && (
                  <FormContainer
                    table="teacher"
                    type="update"
                    data={{
                      ...teacher,
                      username: teacher.user?.username,
                      email: teacher.user?.email,
                      birthday: teacher.birthday ? new Date(teacher.birthday) : undefined,
                      subjects: teacher.subjects,
                    }}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500">
                Éducateur dévoué chez SchooLama.
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/blood.png" alt="groupe sanguin" width={14} height={14} />
                  <span>{teacher.bloodType}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="anniversaire" width={14} height={14} />
                  <span>
                    {new Intl.DateTimeFormat("fr-FR").format(new Date(teacher.birthday))}
                  </span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="email" width={14} height={14} />
                  <span>{teacher.user?.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="téléphone" width={14} height={14} />
                  <span>{teacher.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-card p-4 rounded-lg flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] shadow-md hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-muted/50">
              <Image
                src="/singleBranch.png"
                alt="matières"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">
                  {teacher._count.subjects}
                </h1>
                <span className="text-sm text-gray-400">Matières Enseignées</span>
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] shadow-md hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-muted/50">
              <Image
                src="/singleLesson.png"
                alt="cours"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">
                  N/A
                </h1>
                <span className="text-sm text-gray-400">Cours Donnés</span>
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] shadow-md hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-muted/50">
              <Image
                src="/singleClass.png"
                alt="classes"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">
                  {teacher._count.classes}
                </h1>
                <span className="text-sm text-gray-400">Classes Assignées</span>
              </div>
            </div>
             <div className="bg-card p-4 rounded-lg flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] shadow-md hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-muted/50">
              <Image
                src="/singleAttendance.png"
                alt="présence"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">N/A</h1>
                <span className="text-sm text-gray-400">Présence (N/A)</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 bg-white rounded-md p-4 h-auto">
          <h1 className="text-xl font-semibold mb-4">{`Horaire de ${teacher.name} ${teacher.surname}`}</h1>
          <TimetableDisplay wizardData={wizardData} scheduleData={lessons} />
        </div>
      </div>
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Raccourcis</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
           <Link
              className="p-3 rounded-md bg-lamaSkyLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
              href={`/${locale}/list/classes?supervisorId=${teacher.id}`}
            >
              Classes Supervisées
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaPurpleLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
              href={`/${locale}/list/students?teacherId=${teacher.id}`}
            >
              Étudiants de l'enseignant
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaYellowLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
              href={`/${locale}/list/lessons?teacherId=${teacher.id}`}
            >
              Cours de l'enseignant
            </Link>
            <Link
              className="p-3 rounded-md bg-pink-50 shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
              href={`/${locale}/list/exams?teacherId=${teacher.id}`}
            >
              Examens de l'enseignant
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaSkyLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
              href={`/${locale}/list/assignments?teacherId=${teacher.id}`}
            >
              Devoirs de l'enseignant
            </Link>
          </div>
        </div>
        <Performance title="Performance" />
        <Announcements />
      </div>
    </div>
  );
};

export default SingleTeacherPage;
