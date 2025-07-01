// src/app/[locale]/(dashboard)/list/announcements/page.tsx
import FormContainer from "@/components/FormContainer";
import Pagination from "@/components/Pagination";
import Table from "@/components/Table";
import TableSearch from "@/components/TableSearch";
import { ITEM_PER_PAGE } from "@/lib/settings";
import Image from "next/image";
import Link from 'next/link';
import { getServerSession } from "@/lib/auth-utils";
import { type AnnouncementWithClass } from "@/types/index"; 
import { Prisma, Role } from "@prisma/client"; 
import prisma from "@/lib/prisma";
import { FileText } from 'lucide-react';

interface ColumnConfig {
  header: string;
  accessor: string;
  className?: string;
}

const AnnouncementListPage = async ({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) => {
  
  const session = await getServerSession();
  const userRole = session?.role as Role | undefined;
  const currentUserId = session?.userId;
  
  const baseColumns: ColumnConfig[] = [
    { header: "Titre", accessor: "title" },
    { header: "Contenu", accessor: "content", className: "w-2/5" },
    { header: "Classe", accessor: "class" },
    { header: "Date", accessor: "date", className: "hidden md:table-cell" },
  ];

  const adminColumns: ColumnConfig[] =
    userRole === Role.ADMIN ? [{ header: "Actions", accessor: "action" }] : [];

  const columns: ColumnConfig[] = [...baseColumns, ...adminColumns]; 

  const renderRow = (item: AnnouncementWithClass) => {
    let content;
    try {
      const fileInfo = JSON.parse(item.description || '{}');
      
      if (fileInfo.files && Array.isArray(fileInfo.files) && fileInfo.files.length > 0) {
        if (fileInfo.files.length > 1) {
          // Gallery view - Vertical Scroll
          content = (
            <div className="h-96 max-w-lg overflow-y-auto space-y-2 p-1 pr-2 rounded-lg border bg-background/50">
                {fileInfo.files.map((file: any, index: number) => (
                    <Link key={index} href={file.url} target="_blank" rel="noopener noreferrer" className="block w-full relative aspect-[4/3] rounded-md overflow-hidden group bg-muted/50">
                        <Image
                            src={file.url}
                            alt={`${item.title} - image ${index + 1}`}
                            fill
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
                            style={{ objectFit: 'contain' }}
                            className="group-hover:opacity-80 transition-opacity"
                        />
                    </Link>
                ))}
            </div>
          );
        } else {
          // Single file view
          const file = fileInfo.files[0];
          const fileType = file.type === 'raw' ? 'pdf' : file.type;
          if (fileType === 'image') {
            content = (
              <Link href={file.url} target="_blank" rel="noopener noreferrer" className="block w-full max-w-md relative">
                <Image 
                  src={file.url} 
                  alt={item.title} 
                  width={800}
                  height={1100}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw" 
                  style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                  className="rounded-md hover:opacity-80 transition-opacity" 
                />
              </Link>
            );
          } else {
            content = (
              <Link href={file.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                <FileText className="h-4 w-4"/>
                Voir le document
              </Link>
            );
          }
        }
      } else if (fileInfo.fileUrl && fileInfo.fileType) {
          const fileType = fileInfo.fileType === 'raw' ? 'pdf' : fileInfo.fileType;
          if (fileType === 'image') {
            content = (
              <Link href={fileInfo.fileUrl} target="_blank" rel="noopener noreferrer" className="block w-full max-w-md relative">
                <Image 
                  src={fileInfo.fileUrl} 
                  alt={item.title} 
                  width={800}
                  height={1100}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw" 
                  style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
                  className="rounded-md hover:opacity-80 transition-opacity" 
                />
              </Link>
            );
          } else {
            content = (
              <Link href={fileInfo.fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-primary hover:underline">
                <FileText className="h-4 w-4"/>
                Voir le document
              </Link>
            );
          }
      } else {
        content = <p className="text-muted-foreground whitespace-pre-wrap break-words">{item.description}</p>;
      }
    } catch (e) {
      content = <p className="text-muted-foreground whitespace-pre-wrap break-words">{item.description}</p>;
    }

    return (
      <tr
        key={item.id}
        className="border-b border-gray-200 even:bg-slate-50 text-sm hover:bg-lamaPurpleLight"
      >
        <td className="p-4 font-medium align-top">{item.title}</td>
        <td className="p-4 align-top">{content}</td>
        <td className="p-4 align-top">{item.class?.name || "Tous"}</td>
        <td className="hidden md:table-cell p-4 align-top">{new Intl.DateTimeFormat("fr-FR").format(new Date(item.date))}</td>
        {userRole === Role.ADMIN && (
          <td className="p-4 align-top">
            <div className="flex items-center gap-2">
              <FormContainer table="announcement" type="update" data={item} />
              <FormContainer table="announcement" type="delete" id={item.id} />
            </div>
          </td>
        )}
      </tr>
    );
  };

  const pageParam = searchParams?.page;
  const p = pageParam ? parseInt(Array.isArray(pageParam) ? pageParam[0] : pageParam) : 1;

  const query: Prisma.AnnouncementWhereInput = {};
  
  const searchString = searchParams?.search;
  if (searchString && typeof searchString === 'string' && searchString.trim() !== '') {
    query.title = { contains: searchString, mode: "insensitive" };
  }

  if (userRole && currentUserId) {
    if (userRole === Role.TEACHER) { 
      query.OR = [
        { classId: null }, 
        { 
          class: {
            OR: [
                { supervisorId: currentUserId },
                { lessons: { some: { teacherId: currentUserId } } }
            ]
          }
        }
      ];
    } else if (userRole === Role.STUDENT) { 
      query.OR = [
        { classId: null },
        { class: { students: { some: { id: currentUserId } } } },
      ];
    } else if (userRole === Role.PARENT) { 
      query.OR = [
        { classId: null },
        { class: { students: { some: { parentId: currentUserId } } } },
      ];
    }
  }
  
  const [rawData, count] = await prisma.$transaction([
    prisma.announcement.findMany({
      where: query,
      include: {
        class: { select: { name: true } }, 
      },
      orderBy: { date: 'desc' },
      take: ITEM_PER_PAGE,
      skip: ITEM_PER_PAGE * (p - 1),
    }),
    prisma.announcement.count({ where: query }),
  ]);

 const typedData: AnnouncementWithClass[] = rawData.map(d => { 
    const { class: classInfo, ...baseAnnouncementFields } = d as any;
    return {
      ...baseAnnouncementFields,
      date: new Date(baseAnnouncementFields.date),
      class: classInfo ? { name: classInfo.name } : null, 
    } as AnnouncementWithClass;
  });
  

  return (
    <div className="bg-white p-4 rounded-md flex-1 m-4 mt-0">
      <div className="flex items-center justify-between">
        <h1 className="hidden md:block text-lg font-semibold">
          Toutes les annonces
        </h1>
        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          <TableSearch />
          <div className="flex items-center gap-4 self-end">
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/filter.png" alt="" width={14} height={14} />
            </button>
            <button className="w-8 h-8 flex items-center justify-center rounded-full bg-lamaYellow">
              <Image src="/sort.png" alt="" width={14} height={14} />
            </button>
            {userRole === Role.ADMIN && ( 
              <FormContainer table="announcement" type="create" />
            )}
          </div>
        </div>
      </div>
      <Table<AnnouncementWithClass> columns={columns} renderRow={renderRow} data={typedData} /> 
      <Pagination page={p} count={count} />
    </div>
  );
};

export default AnnouncementListPage;
