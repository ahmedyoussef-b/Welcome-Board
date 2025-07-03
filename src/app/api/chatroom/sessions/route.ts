// src/app/api/chatroom/sessions/route.ts
import { NextResponse, type NextRequest } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from '@/lib/auth-utils';
import { Role } from '@/types';

export async function POST(request: NextRequest) {
  const sessionInfo = await getServerSession();
  if (!sessionInfo?.userId) {
    return NextResponse.json({ message: 'Non autorisé' }, { status: 401 });
  }

  const { title, type, classId, participantIds } = await request.json();

  if (!title || !type || !participantIds || !Array.isArray(participantIds)) {
    return NextResponse.json({ message: 'Données de session invalides' }, { status: 400 });
  }

  try {
    const hostId = sessionInfo.userId;

    const newSession = await prisma.chatroomSession.create({
      data: {
        title,
        type,
        hostId,
        classId: type === 'CLASS' ? parseInt(classId, 10) : null,
        participants: {
          create: [
            // Add the host as a participant
            { userId: hostId }, 
            // Add the other participants
            ...participantIds.map((id: string) => ({ userId: id })),
          ],
        },
      },
      include: {
        participants: {
          include: {
            user: {
                select: { id: true, name: true, email: true, img: true, role: true }
            }
          }
        },
        messages: true
      }
    });

    return NextResponse.json(newSession, { status: 201 });
  } catch (error) {
    console.error('[API] Erreur lors de la création de la session:', error);
    return NextResponse.json({ message: 'Erreur interne du serveur' }, { status: 500 });
  }
}
