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
    
    // Validate that all teachers and classes exist before starting the transaction
    const teacherIds = assignments.map(a => a.teacherId);
    const classIds = Array.from(new Set(assignments.flatMap(a => a.classIds)));

    if (teacherIds.length > 0) {
        const existingTeachersCount = await prisma.teacher.count({ where: { id: { in: teacherIds } } });
        if (existingTeachersCount !== teacherIds.length) {
            return NextResponse.json({ message: "Un ou plusieurs IDs d'enseignants sont invalides." }, { status: 400 });
        }
    }
    if (classIds.length > 0) {
        const existingClassesCount = await prisma.class.count({ where: { id: { in: classIds } } });
        if (existingClassesCount !== classIds.length) {
            return NextResponse.json({ message: "Un ou plusieurs IDs de classes sont invalides." }, { status: 400 });
        }
    }
    // --- End Validation ---

    await prisma.$transaction(async (tx) => {
      // Step 1: For each teacher in the payload, find the classes they currently supervise
      // and un-assign any that are NOT in their new assignment list.
      for (const assignment of assignments) {
        const { teacherId, classIds: newClassIds } = assignment;
        
        const supervisedClasses = await tx.class.findMany({
          where: { supervisorId: teacherId },
          select: { id: true },
        });
        const currentClassIds = supervisedClasses.map(c => c.id);

        const classesToUnassign = currentClassIds.filter(id => !newClassIds.includes(id));
        
        if (classesToUnassign.length > 0) {
          await tx.class.updateMany({
            where: { id: { in: classesToUnassign } },
            data: { supervisorId: null },
          });
        }
      }

      // Step 2: Now, assign all the new relationships.
      // This is done in a second loop to avoid transaction conflicts where one teacher's
      // un-assignment might interfere with another's assignment.
      for (const assignment of assignments) {
        const { teacherId, classIds: newClassIds } = assignment;

        if (newClassIds.length > 0) {
          // This operation is safe because any previous supervisor of these classes
          // (if they were in our teacher list) would have been cleared in Step 1.
          // If the supervisor was NOT in our list, this update is still valid.
          await tx.class.updateMany({
            where: { id: { in: newClassIds } },
            data: { supervisorId: teacherId },
          });
        }
      }
    });

    return NextResponse.json({ message: "Assignations des professeurs mises à jour avec succès." }, { status: 200 });

  } catch (error) {
    console.error('[API batch-assign] General Error:', error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error('[API batch-assign] Prisma Error:', { code: error.code, meta: error.meta, message: error.message });
      return NextResponse.json({ message: `Erreur de base de données. Code: ${error.code}`, details: error.meta }, { status: 500 });
    }
    const errorMessage = error instanceof Error ? error.message : 'Une erreur interne est survenue.';
    return NextResponse.json({ message: "Une erreur interne est survenue lors de la sauvegarde des assignations.", error: errorMessage }, { status: 500 });
  }
}
