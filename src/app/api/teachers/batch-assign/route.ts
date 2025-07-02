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
    console.log("[API/batch-assign] Received POST request.");
    const body = await request.json();
    const validation = batchAssignSchema.safeParse(body);

    if (!validation.success) {
      console.error("[API/batch-assign] Validation Error:", validation.error.flatten());
      return NextResponse.json({ message: "Données d'entrée invalides", errors: validation.error.flatten().fieldErrors }, { status: 400 });
    }

    const assignments = validation.data;
    console.log(`[API/batch-assign] Validated payload with ${assignments.length} assignment groups.`);
    
    // --- Pre-transaction validation ---
    const teacherIds = assignments.map(a => a.teacherId);
    const classIds = Array.from(new Set(assignments.flatMap(a => a.classIds)));

    if (teacherIds.length > 0) {
        const existingTeachersCount = await prisma.teacher.count({ where: { id: { in: teacherIds } } });
        if (existingTeachersCount !== teacherIds.length) {
            console.error("[API/batch-assign] Validation Error: One or more teacher IDs are invalid.");
            return NextResponse.json({ message: "Un ou plusieurs IDs d'enseignants sont invalides." }, { status: 400 });
        }
    }
    if (classIds.length > 0) {
        const existingClassesCount = await prisma.class.count({ where: { id: { in: classIds } } });
        if (existingClassesCount !== classIds.length) {
            console.error("[API/batch-assign] Validation Error: One or more class IDs are invalid.");
            return NextResponse.json({ message: "Un ou plusieurs IDs de classes sont invalides." }, { status: 400 });
        }
    }
    console.log("[API/batch-assign] Pre-transaction validation passed.");
    // --- End Validation ---

    await prisma.$transaction(async (tx) => {
      console.log("[API/batch-assign] Starting transaction.");
      
      // Step 1: Clear all supervisor assignments for the teachers involved in this batch update.
      // This prevents unique constraint violations if a class is moved from one teacher to another within the same batch.
      console.log(`[API/batch-assign] Step 1: Clearing current assignments for ${teacherIds.length} teachers.`);
      await tx.class.updateMany({
        where: {
          supervisorId: {
            in: teacherIds,
          },
        },
        data: {
          supervisorId: null,
        },
      });
      console.log("[API/batch-assign] Step 1: Assignments cleared.");

      // Step 2: Apply the new assignments.
      console.log("[API/batch-assign] Step 2: Applying new assignments.");
      for (const assignment of assignments) {
        const { teacherId, classIds: newClassIds } = assignment;

        if (newClassIds.length > 0) {
          console.log(`[API/batch-assign] Assigning ${newClassIds.length} classes to teacher ${teacherId}.`);
          await tx.class.updateMany({
            where: { id: { in: newClassIds } },
            data: { supervisorId: teacherId },
          });
        }
      }
      console.log("[API/batch-assign] Step 2: New assignments applied.");
      console.log("[API/batch-assign] Transaction successful.");
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
