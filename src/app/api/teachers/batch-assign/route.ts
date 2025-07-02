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

    const newAssignments = validation.data;
    const teacherIds = newAssignments.map(a => a.teacherId);
    
    if (teacherIds.length === 0) {
      return NextResponse.json({ message: "Aucune assignation à traiter." }, { status: 200 });
    }

    // --- State Calculation Logic ---
    
    // 1. Fetch the current state of all classes that are currently supervised by the teachers involved.
    const currentSupervisedClasses = await prisma.class.findMany({
        where: { supervisorId: { in: teacherIds } },
        select: { id: true, supervisorId: true }
    });
    const currentAssignmentsMap = new Map(currentSupervisedClasses.map(c => [c.id, c.supervisorId]));

    // 2. Create a map of the NEW desired state from the client payload.
    const newAssignmentsMap = new Map<number, string>();
    newAssignments.forEach(a => {
        a.classIds.forEach(cid => {
            newAssignmentsMap.set(cid, a.teacherId);
        });
    });

    // 3. Determine the minimal list of updates required.
    const updatesToPerform: { classId: number, newSupervisorId: string | null }[] = [];
    const allAffectedClassIds = new Set([...currentAssignmentsMap.keys(), ...newAssignmentsMap.keys()]);

    allAffectedClassIds.forEach(classId => {
        const currentSupervisor = currentAssignmentsMap.get(classId) ?? null;
        const newSupervisor = newAssignmentsMap.get(classId) ?? null;

        if (currentSupervisor !== newSupervisor) {
            updatesToPerform.push({ classId: classId, newSupervisorId: newSupervisor });
        }
    });

    // 4. Execute the precise updates in a single transaction if there are changes.
    if (updatesToPerform.length > 0) {
        await prisma.$transaction(
            updatesToPerform.map(update => 
                prisma.class.update({
                    where: { id: update.classId },
                    data: { supervisorId: update.newSupervisorId }
                })
            )
        );
    }

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
