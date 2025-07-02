// src/components/wizard/TeachersForm.tsx
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Save, Loader2, User, Users, RotateCcw } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { TeacherWithDetails, ClassWithGrade } from '@/types';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { selectAllProfesseurs, saveTeacherAssignments, setSupervisorForClass, unassignAllClasses } from '@/lib/redux/features/teachers/teachersSlice';
import { selectAllClasses } from '@/lib/redux/features/classes/classesSlice';
import { selectAllGrades } from '@/lib/redux/features/grades/gradesSlice';
import { useToast } from '@/hooks/use-toast';

const TeachersForm: React.FC = () => {
  const dispatch = useAppDispatch();
  const { toast } = useToast();

  const allTeachers = useAppSelector(selectAllProfesseurs);
  const allClasses = useAppSelector(selectAllClasses);
  const allGrades = useAppSelector(selectAllGrades);

  const [isSaving, setIsSaving] = useState(false);

  // Helper to find the current supervisor for a class
  const findSupervisorId = (classId: number): string | undefined => {
    const teacher = allTeachers.find(t => t.classes.some(c => c.id === classId));
    return teacher?.id;
  };

  const handleSupervisorChange = (classId: number, newTeacherId: string) => {
    // 'none' is a special value from the SelectItem to indicate no supervisor
    const teacherIdOrNull = newTeacherId === 'none' ? null : newTeacherId;
    dispatch(setSupervisorForClass({ classId, teacherId: teacherIdOrNull }));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    const assignmentPayload = allTeachers.map(teacher => ({
        teacherId: teacher.id,
        classIds: teacher.classes.map(cls => cls.id),
    }));

    const result = await dispatch(saveTeacherAssignments(assignmentPayload));
    
    if (saveTeacherAssignments.fulfilled.match(result)) {
        toast({
            title: "Sauvegarde réussie",
            description: "Les assignations des professeurs principaux ont été enregistrées.",
        });
    } else {
        toast({
            variant: "destructive",
            title: "Erreur de sauvegarde",
            description: "Une erreur est survenue lors de la sauvegarde des assignations.",
        });
    }
    setIsSaving(false);
  };

  const handleResetAssignments = () => {
    dispatch(unassignAllClasses());
    toast({
        title: "Assignations réinitialisées",
        description: "Tous les professeurs principaux ont été désassignés.",
    });
  };

  return (
      <div className="space-y-6">
        <Card className="p-6 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <User className="text-primary" size={24} />
                    <div>
                        <h3 className="text-lg font-semibold">Assigner les Professeurs Principaux aux Classes</h3>
                        <p className="text-sm text-muted-foreground">Chaque classe doit avoir un seul superviseur.</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 self-end md:self-center">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                         <Button variant="outline" disabled={isSaving}>
                            <RotateCcw className="mr-2 h-4 w-4" />
                            Réinitialiser
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmer la réinitialisation ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Cette action va désassigner tous les professeurs principaux de toutes les classes. Voulez-vous continuer ?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction onClick={handleResetAssignments} className="bg-destructive hover:bg-destructive/90">Confirmer</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>

                    <Button onClick={handleSaveChanges} disabled={isSaving}>
                        {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isSaving ? 'Sauvegarde...' : 'Sauvegarder'}
                    </Button>
                </div>
            </div>
        </Card>

        <Accordion type="multiple" className="w-full space-y-4" defaultValue={allGrades.map(g => `grade-${g.id}`)}>
            {allGrades.map(grade => {
                const classesInGrade = allClasses.filter(c => c.gradeId === grade.id);
                if (classesInGrade.length === 0) return null;

                return (
                    <AccordionItem value={`grade-${grade.id}`} key={grade.id} className="border rounded-lg overflow-hidden bg-card">
                        <AccordionTrigger className="px-6 py-4 bg-muted/30 hover:bg-muted/50">
                            <div className="flex items-center gap-3">
                                <Users className="h-5 w-5 text-primary" />
                                <h3 className="text-lg font-semibold">Niveau {grade.level} ({classesInGrade.length} classes)</h3>
                            </div>
                        </AccordionTrigger>
                        <AccordionContent className="p-4 md:p-6 space-y-4">
                            {classesInGrade.map(cls => {
                                const supervisorId = findSupervisorId(cls.id);
                                return (
                                    <div key={cls.id} className="p-4 border rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                                        <div className="font-medium">{cls.name}</div>
                                        <div className="w-full sm:w-64">
                                            <Select
                                                value={supervisorId || 'none'}
                                                onValueChange={(newTeacherId) => handleSupervisorChange(cls.id, newTeacherId)}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Choisir un professeur principal..." />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Aucun</SelectItem>
                                                    {allTeachers.map(teacher => (
                                                        <SelectItem key={teacher.id} value={teacher.id}>
                                                            {teacher.name} {teacher.surname}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                );
                            })}
                        </AccordionContent>
                    </AccordionItem>
                );
            })}
        </Accordion>
      </div>
  );
};

export default TeachersForm;
