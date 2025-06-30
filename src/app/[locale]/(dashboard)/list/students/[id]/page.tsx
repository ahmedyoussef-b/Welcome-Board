// src/app/[locale]/(dashboard)/list/students/[id]/page.tsx
import Announcements from "@/components/Announcements";
import FormContainer from "@/components/FormContainer";
import Performance from "@/components/Performance";
import { getServerSession } from "@/lib/auth-utils";
import prisma from "@/lib/prisma";
import { type StudentWithDetails, type WizardData, type ClassWithGrade, type TeacherWithDetails, type Subject, type Classroom } from "@/types/index";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import  {Role} from "@prisma/client";
import DynamicAvatar from "@/components/DynamicAvatar";
import TimetableDisplay from "@/components/schedule/TimetableDisplay";
import StudentWeeklyAttendanceChart from "@/components/attendance/StudentWeeklyAttendanceChart";

const SingleStudentPage = async ({
  params,
}: {
  params: { id: string };
}) => {
  const { id } = params;
  const locale = 'fr'; // Locale fixe

  const session = await getServerSession();
  const userRole = session?.role as Role | undefined;
  const currentUserId = session?.userId;

  if (!session) redirect(`/${locale}/login`);

  const student: StudentWithDetails | null =
    await prisma.student.findUnique({
      where: { id },
      include: {
        user: true,
        class: { include: { _count: { select: { lessons: true } }, grade: true } },
        parent: true,
        grade: true,
      },
  });

  if (!student || !student.class) {
    return notFound();
  }

  let canView = false;
  if (userRole === Role.ADMIN) {
    canView = true;
  } else if (userRole === Role.TEACHER && currentUserId) {
    const teacherClasses = await prisma.class.findMany({
      where: {
        OR: [
          { supervisorId: currentUserId },
          { lessons: { some: { teacherId: currentUserId } } }
        ],
        students: { some: { id: student.id } }
      },
      select: { id: true }
    });
    if (teacherClasses.length > 0) canView = true;
  } else if (userRole === Role.PARENT && currentUserId) {
    if (student.parentId === currentUserId) canView = true;
  } else if (userRole === Role.STUDENT && currentUserId) {
    if (student.id === currentUserId) canView = true;
  }

  if (!canView) {
     redirect(`/${locale}/${userRole?.toLowerCase() || 'login'}`);
  }

  // Fetch data for TimetableDisplay
  const [lessons, allSubjects, allTeachers, allClassrooms] = await Promise.all([
    prisma.lesson.findMany({
      where: { classId: student.classId },
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
    }),
    prisma.subject.findMany(),
    prisma.teacher.findMany({ 
        include: { 
            user: true, 
            subjects: true, 
            classes: true,
            _count: { select: { classes: true, subjects: true } } 
        } 
    }),
    prisma.classroom.findMany(),
  ]);

  const studentClass = student.class as ClassWithGrade;

  const wizardData: WizardData = {
    school: {
      name: `Classe ${student.class.name}`,
      startTime: '08:00',
      endTime: '17:00',
      schoolDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'],
      sessionDuration: 60,
    },
    classes: [studentClass], 
    subjects: allSubjects,
    teachers: allTeachers as TeacherWithDetails[],
    rooms: allClassrooms,
  };

  return (
    <div className="flex-1 p-4 flex flex-col gap-4 xl:flex-row">
      <div className="w-full xl:w-2/3">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="bg-lamaSky py-6 px-4 rounded-md flex-1 flex gap-4">
            <div className="w-1/3 flex items-center justify-center">
              <div className="w-36 h-36 flex items-center justify-center overflow-hidden rounded-full bg-muted">
                <DynamicAvatar 
                  imageUrl={student.user?.img || student.img}
                  seed={student.id || student.user?.email || Math.random().toString(36).substring(7)}
                />
              </div>
            </div>
            <div className="w-2/3 flex flex-col justify-between gap-4">
              <div className="flex items-center gap-4">
                <h1 className="text-xl font-semibold">
                  {student.name} {student.surname}
                </h1>
                {userRole === Role.ADMIN && (
                  <FormContainer
                    table="student"
                    type="update"
                    data={{
                      ...student,
                      username: student.user?.username,
                      email: student.user?.email,
                      birthday: student.birthday ? new Date(student.birthday) : undefined,
                    }}
                  />
                )}
              </div>
              <p className="text-sm text-gray-500">
                Étudiant à SchooLama, apprenant enthousiaste.
              </p>
              <div className="flex items-center justify-between gap-2 flex-wrap text-xs font-medium">
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/blood.png" alt="groupe sanguin" width={14} height={14} />
                  <span>{student.bloodType}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/date.png" alt="anniversaire" width={14} height={14} />
                  <span>
                    {new Intl.DateTimeFormat("fr-FR").format(new Date(student.birthday))}
                  </span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/mail.png" alt="email" width={14} height={14} />
                  <span>{student.user?.email || "-"}</span>
                </div>
                <div className="w-full md:w-1/3 lg:w-full 2xl:w-1/3 flex items-center gap-2">
                  <Image src="/phone.png" alt="téléphone" width={14} height={14} />
                  <span>{student.phone || "-"}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 flex gap-4 justify-between flex-wrap">
            <div className="bg-card p-4 rounded-lg flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] shadow-md hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-muted/50">
              <Image
                src="/singleBranch.png"
                alt="niveau"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">
                  {student.class.name.charAt(0)}e
                </h1>
                <span className="text-sm text-gray-400">Niveau</span>
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
                  {student.class._count.lessons}
                </h1>
                <span className="text-sm text-gray-400">Cours</span>
              </div>
            </div>
            <div className="bg-card p-4 rounded-lg flex gap-4 w-full md:w-[48%] xl:w-[45%] 2xl:w-[48%] shadow-md hover:shadow-xl transition-all duration-300 ease-in-out hover:-translate-y-1 hover:bg-muted/50">
              <Image
                src="/singleClass.png"
                alt="classe"
                width={24}
                height={24}
                className="w-6 h-6"
              />
              <div>
                <h1 className="text-xl font-semibold">{student.class.name}</h1>
                <span className="text-sm text-gray-400">Classe</span>
              </div>
            </div>
          </div>
        </div>
        <div className="mt-4 bg-white rounded-md p-4 h-auto">
          <h1 className="text-xl font-semibold mb-4">{`Horaire de ${student.name} ${student.surname}`}</h1>
          <TimetableDisplay wizardData={wizardData} scheduleData={lessons} />
        </div>
      </div>
      <div className="w-full xl:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-4 rounded-md">
          <h1 className="text-xl font-semibold">Raccourcis</h1>
          <div className="mt-4 flex gap-4 flex-wrap text-xs text-gray-500">
            <Link
              className="p-3 rounded-md bg-lamaSkyLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
              href={`/${locale}/list/lessons?classId=${student.classId}`}
            >
              Cours de l'étudiant
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaPurpleLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
              href={`/${locale}/list/teachers?classId=${student.classId}`}
            >
              Enseignants de l'étudiant
            </Link>
            <Link
              className="p-3 rounded-md bg-pink-50 shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
              href={`/${locale}/list/exams?classId=${student.classId}`}
            >
              Examens de l'étudiant
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaSkyLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
              href={`/${locale}/list/assignments?classId=${student.classId}`}
            >
              Devoirs de l'étudiant
            </Link>
            <Link
              className="p-3 rounded-md bg-lamaYellowLight shadow-sm hover:shadow-md hover:scale-105 transform transition-all duration-200 ease-out"
              href={`/${locale}/list/results?studentId=${student.id}`}
            >
              Résultats de l'étudiant
            </Link>
          </div>
        </div>
        <Suspense fallback={<p>Chargement de la présence...</p>}>
            <StudentWeeklyAttendanceChart studentId={student.id} />
        </Suspense>
        <Announcements />
      </div>
    </div>
  );
};

export default SingleStudentPage;
