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
    const teacherIdsInPayload = assignments.map(a => a.teacherId);

    await prisma.$transaction(async (tx) => {
      // 1. Clear all current supervisions for the teachers involved.
      // This prevents potential conflicts and handles un-assignments.
      await tx.class.updateMany({
        where: {
          supervisorId: {
            in: teacherIdsInPayload,
          },
        },
        data: {
          supervisorId: null,
        },
      });

      // 2. Set the new supervisions.
      // This loop is sequential. If a class is assigned to multiple teachers in the payload, the last one will win.
      // The UI should ideally prevent this, but this ensures the operation doesn't fail.
      for (const { teacherId, classIds } of assignments) {
        if (classIds.length > 0) {
          // You might want to add a check here to ensure a class isn't already assigned
          // to another teacher within this same batch operation, but for now, last-write-wins.
          await tx.class.updateMany({
            where: {
              id: {
                in: classIds,
              },
            },
            data: {
              supervisorId: teacherId,
            },
          });
        }
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
