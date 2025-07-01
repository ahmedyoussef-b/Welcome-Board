// src/app/api/public-announcements/route.ts
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const publicAnnouncementSchema = z.object({
  title: z.string().min(1, 'Le titre est requis.'),
  fileUrl: z.string().url('Une URL de fichier valide est requise.'),
  fileType: z.enum(['image', 'pdf', 'other']),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validation = publicAnnouncementSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ message: 'Données invalides', errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const { title, fileUrl, fileType } = validation.data;

    // We'll store the public announcement in the regular Announcement table.
    // We can use the description field to store structured data (JSON string).
    const publicAnnouncementData = {
      isPublic: true,
      url: fileUrl,
      type: fileType,
    };

    const newAnnouncement = await prisma.announcement.create({
      data: {
        title,
        description: JSON.stringify(publicAnnouncementData),
        date: new Date(),
        // Public announcements are not tied to a specific class
        classId: null,
      },
    });

    return NextResponse.json(newAnnouncement, { status: 201 });
  } catch (error) {
    console.error('[API/public-announcements POST] Error:', error);
    return NextResponse.json({ message: "Erreur lors de la publication de l'annonce." }, { status: 500 });
  }
}

export async function GET() {
  try {
    const allAnnouncements = await prisma.announcement.findMany({
      orderBy: { date: 'desc' }, // Corrected from createdAt to date
      take: 20, // Fetch more to ensure we get enough public ones
    });

    const publicAnnouncements = allAnnouncements
      .map(ann => {
        try {
          // Attempt to parse the description as JSON
          const publicData = JSON.parse(ann.description || '{}');
          if (publicData.isPublic) {
            return {
              id: ann.id,
              title: ann.title,
              date: ann.date,
              url: publicData.url,
              type: publicData.type,
            };
          }
          return null;
        } catch (e) {
          // Not a JSON description, so not a public announcement
          return null;
        }
      })
      .filter(Boolean)
      .slice(0, 10); // Limit to the 10 most recent public ones

    return NextResponse.json(publicAnnouncements);
  } catch (error) {
     if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2021') {
      console.error('API/public-announcements GET: Table `Announcement` not found. Has `prisma migrate dev` been run?');
      return NextResponse.json({ message: 'Le service est temporairement indisponible.', error: "Table 'Announcement' not found." }, { status: 503 });
    }
    console.error('[API/public-announcements GET] Error:', error);
    return NextResponse.json({ message: "Erreur lors de la récupération des annonces publiques." }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json({ message: 'ID de l\'annonce manquant' }, { status: 400 });
    }

    await prisma.announcement.delete({
      where: { id: Number(id) },
    });

    return NextResponse.json({ message: 'Annonce supprimée avec succès' });
  } catch (error: any) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ message: 'Annonce non trouvée' }, { status: 404 });
    }
    console.error('[API/public-announcements DELETE] Error:', error);
    return NextResponse.json({ message: 'Erreur lors de la suppression de l\'annonce' }, { status: 500 });
  }
}
