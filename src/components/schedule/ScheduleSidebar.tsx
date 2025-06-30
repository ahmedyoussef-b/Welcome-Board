// src/components/schedule/ScheduleSidebar.tsx
'use client';
import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { GripVertical } from 'lucide-react';
import type { Subject } from '@/types';

function DraggableSubject({ subject }: { subject: Subject }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: `subject-${subject.id}`,
    data: { subject },
  });

  const style = transform ? { 
    transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    zIndex: 10,
    } : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="p-2 mb-2 border rounded-md bg-card flex items-center gap-2 cursor-grab active:cursor-grabbing active:shadow-lg active:z-10"
    >
      <GripVertical className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm">{subject.name}</span>
    </div>
  );
}

export function ScheduleSidebar({ subjects }: { subjects: Subject[] }) {
  return (
    <Card className="w-full print-hidden">
      <CardHeader>
        <CardTitle>Matières</CardTitle>
        <CardDescription>Glissez une matière sur un cours pour le modifier.</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[60vh]">
          <div className="space-y-1 pr-2">
            {subjects.map(subject => (
              <DraggableSubject key={subject.id} subject={subject} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
