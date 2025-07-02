// src/components/schedule/ScheduleSidebar.tsx
'use client';
import React from 'react';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { toggleSelectedSubject, selectCurrentSubject } from '@/lib/redux/features/wizardSlice';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import type { Subject } from '@/types';

export function ScheduleSidebar({ subjects }: { subjects: Subject[] }) {
    const dispatch = useAppDispatch();
    const selectedSubject = useAppSelector(selectCurrentSubject);
    const { toast } = useToast();

    const handleSubjectClick = (subject: Subject) => {
        dispatch(toggleSelectedSubject(subject));
        const isCurrentlySelected = selectedSubject?.id === subject.id;
        if (isCurrentlySelected) {
            toast({ title: "Sélection annulée" });
        } else {
            toast({ title: `"${subject.name}" sélectionné`, description: "Double-cliquez sur un créneau disponible pour l'assigner." });
        }
    };

    return (
        <Card className="w-full print-hidden">
            <CardHeader>
                <CardTitle>Matières</CardTitle>
                <CardDescription>Cliquez pour sélectionner/désélectionner une matière.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[60vh]">
                    <div className="space-y-1 pr-2">
                        {subjects.map(subject => {
                            const isSelected = subject.id === selectedSubject?.id;
                            return (
                                <div
                                    key={subject.id}
                                    onClick={() => handleSubjectClick(subject)}
                                    className={cn(
                                        "p-3 mb-2 border rounded-md bg-card flex items-center gap-2 cursor-pointer transition-colors",
                                        isSelected ? "ring-2 ring-primary bg-primary/10" : "hover:bg-muted"
                                    )}
                                    title={`${subject.name} - Cliquez pour sélectionner`}
                                >
                                    <span className="text-sm font-medium">{subject.name}</span>
                                </div>
                            )
                        })}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
