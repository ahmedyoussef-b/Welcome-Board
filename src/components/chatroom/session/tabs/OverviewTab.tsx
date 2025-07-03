// src/components/chatroom/session/tabs/OverviewTab.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import VideoTile from '../VideoTile';
import { Video } from 'lucide-react';
import type { ActiveSession, SafeUser } from '@/types';
import { useState } from 'react';
import { DndContext, closestCenter, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useAppDispatch } from '@/hooks/redux-hooks';
import { moveParticipant } from '@/lib/redux/slices/sessionSlice';

const DraggableVideoTile = ({ participant, user }: { participant: any, user: SafeUser | null }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition
    } = useSortable({id: participant.id});

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };
    
    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            <VideoTile
              key={participant.id}
              name={participant.id === user?.id ? `${participant.name} (Vous)`: participant.name}
              isOnline={participant.isOnline}
              isTeacher={participant.role === 'teacher' || participant.role === 'admin'}
              hasRaisedHand={participant.hasRaisedHand}
              points={participant.points}
              badgeCount={participant.badges?.length}
            />
        </div>
    );
}

interface OverviewTabProps {
  activeSession: ActiveSession;
  user: SafeUser | null;
}

export default function OverviewTab({ activeSession, user }: OverviewTabProps) {
  const dispatch = useAppDispatch();
  const onlineCount = activeSession.participants.filter(p => p.isOnline).length;
  const sensors = useSensors(useSensor(MouseSensor), useSensor(TouchSensor));

  const handleDragEnd = (event: any) => {
    const {active, over} = event;

    if (active.id !== over.id) {
        const oldIndex = activeSession.participants.findIndex(p => p.id === active.id);
        const newIndex = activeSession.participants.findIndex(p => p.id === over.id);
        dispatch(moveParticipant({ fromIndex: oldIndex, toIndex: newIndex }));
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="w-5 h-5" />
          Participants ({onlineCount} connectés)
        </CardTitle>
      </CardHeader>
      <CardContent>
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext 
              items={activeSession.participants.map(p => p.id)}
              strategy={rectSortingStrategy}
            >
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {activeSession.participants.map((participant) => (
                    <DraggableVideoTile key={participant.id} participant={participant} user={user} />
                ))}
                </div>
            </SortableContext>
          </DndContext>
      </CardContent>
    </Card>
  );
}
