import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth-utils";
import { Role, type AnnouncementWithClass } from "@/types/index"; 
import type { Prisma } from "@prisma/client";
import Link from 'next/link';
import Image from "next/image";
import { FileText } from "lucide-react";

const Announcements = async () => {
  const session = await getServerSession();
  const userRole = session?.role as Role | undefined; 
  const currentUserId = session?.userId;

  const queryOptions: Prisma.AnnouncementFindManyArgs = {
    take: 3,
    orderBy: { date: "desc" },
    include: { class: { select: { name: true } } } 
  };

  if (userRole && currentUserId && userRole !== Role.ADMIN) {
    const roleConditions: Prisma.AnnouncementWhereInput = {};
    if (userRole === Role.TEACHER) {
      roleConditions.class = { 
        OR: [
            { supervisorId: currentUserId },
            { lessons: { some: { teacherId: currentUserId } } }
        ]
      };
    } else if (userRole === Role.STUDENT) {
      roleConditions.class = { students: { some: { id: currentUserId } } };
    } else if (userRole === Role.PARENT) {
      roleConditions.class = { students: { some: { parentId: currentUserId } } };
    }
    
    queryOptions.where = {
        OR: [
          { classId: null }, 
          roleConditions
        ].filter(condition => Object.keys(condition).length > 0) 
    };
  }

  const data: AnnouncementWithClass[] = await prisma.announcement.findMany(queryOptions) as AnnouncementWithClass[];

  if (!data || data.length === 0) {
    return (
      <div className="bg-muted p-4 rounded-md">
        <h1 className="text-xl font-semibold">Annonces</h1>
        <p className="text-sm text-gray-400 mt-4">Pas d'annonces pour le moment.</p>
      </div>
    );
  }

  return (
    <div className="bg-muted p-4 rounded-md">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Annonces</h1>
      </div>
      <div className="flex flex-col gap-4 mt-4">
        {data.map((announcement, index) => {
           const cardColors = ["bg-lamaSkyLight", "bg-lamaPurpleLight", "bg-lamaYellowLight"];
           const cardColor = cardColors[index % cardColors.length];

           let content;
           try {
             const fileInfo = JSON.parse(announcement.description || '{}');
             if (fileInfo.fileUrl) {
                if (fileInfo.fileType === 'image') {
                    content = (
                        <Link href={fileInfo.fileUrl} target="_blank" rel="noopener noreferrer" className="mt-2 block aspect-video w-full relative overflow-hidden rounded-md group-hover:opacity-90 transition-opacity">
                            <Image 
                                src={fileInfo.fileUrl} 
                                alt={announcement.title} 
                                fill
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                className="object-cover"
                            />
                        </Link>
                    );
                } else {
                    content = (
                        <Link href={fileInfo.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline mt-1">
                            <FileText className="h-4 w-4"/>
                            <span>Voir le document</span>
                        </Link>
                    );
                }
             } else {
               content = <p className="text-sm text-gray-600 mt-1">{announcement.description}</p>;
             }
           } catch (e) {
             content = <p className="text-sm text-gray-600 mt-1">{announcement.description}</p>;
           }

          return (
            <div className={`${cardColor} rounded-md p-4 group`} key={announcement.id}>
              <div className="flex items-center justify-between">
                <h2 className="font-medium">{announcement.title}</h2>
                <span className="text-xs text-gray-500 bg-background rounded-md px-1 py-1">
                  {new Intl.DateTimeFormat("fr-FR").format(new Date(announcement.date))}
                </span>
              </div>
              {content}
              {announcement.class && <p className="text-xs text-gray-500 mt-1">Pour: Classe {announcement.class.name}</p>}
              {!announcement.class && <p className="text-xs text-gray-500 mt-1">Pour: Tous</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Announcements;
