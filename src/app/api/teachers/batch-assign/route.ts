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
    const teacherIdsInvolved = assignments.map(a => a.teacherId);

    // No teachers involved? Nothing to do.
    if (teacherIdsInvolved.length === 0) {
        return NextResponse.json({ message: "Aucune assignation à traiter." }, { status: 200 });
    }
    
    await prisma.$transaction(async (tx) => {
        // Step 1: Un-assign ALL classes currently supervised by any of the teachers in this batch.
        // This is the crucial step to prevent conflicts when a class is moved from one teacher to another.
        // We are "releasing" all classes from their current supervisors (within this batch)
        // before re-assigning them.
        await tx.class.updateMany({
            where: {
                supervisorId: {
                    in: teacherIdsInvolved,
                },
            },
            data: {
                supervisorId: null,
            },
        });
        
        // Step 2: Iterate through the new assignment list and apply them.
        // Since we've cleared the previous assignments, we can safely set the new ones.
        for (const assignment of assignments) {
            if (assignment.classIds.length > 0) {
                await tx.class.updateMany({
                    where: {
                        id: {
                            in: assignment.classIds,
                        },
                    },
                    data: {
                        supervisorId: assignment.teacherId,
                    },
                });
            }
        }
    });

    return NextResponse.json({ message: "Assignations des professeurs mises à jour avec succès." }, { status: 200 });

  } catch (error) {
    console.error('[API/batch-assign] An error occurred:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('[API/batch-assign] Prisma Error:', { code: error.code, meta: error.meta, message: error.message });
      return NextResponse.json({ message: `Erreur de base de données. Code: ${error.code}`, details: error.meta }, { status: 500 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Une erreur interne est survenue.';
    return NextResponse.json({ message: "Une erreur interne est survenue lors de la sauvegarde des assignations.", error: errorMessage }, { status: 500 });
  }
}
