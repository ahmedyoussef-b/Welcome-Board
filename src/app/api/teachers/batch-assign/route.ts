// src/app/api/teachers/batch-assign/route.ts
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { z } from 'zod';
import { Prisma } from '@prisma/client';

const assignmentSchema = z.object({
  teacherId: z.string(),
  classIds: z.array(z.number()),
});

const batchAssignSchema = z.array(assignmentSchema);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = batchAssignSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json({ message: "Données d'entrée invalides", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const assignments = validation.data;

    await prisma.$transaction(async (tx) => {
      for (const { teacherId, classIds } of assignments) {
        await tx.teacher.update({
          where: { id: teacherId },
          data: {
            classes: {
              set: classIds.map(id => ({ id })),
            },
          },
        });
      }
    });

    return NextResponse.json({ message: "Assignations des professeurs mises à jour avec succès." }, { status: 200 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: 'Données invalides', errors: error.errors }, { status: 400 });
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('Prisma Error in batch-assign:', error);
      return NextResponse.json({ message: `Erreur de base de données: ${error.message}` }, { status: 500 });
    }
    console.error('General Error in batch-assign:', error);
    return NextResponse.json({ message: "Une erreur interne est survenue lors de la sauvegarde des assignations.", error: (error as Error).message }, { status: 500 });
  }
}
