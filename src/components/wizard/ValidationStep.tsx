// src/components/wizard/ValidationStep.tsx
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertTriangle, Download, Calendar, School, Users, BookOpen, MapPin, Clock, Eye, Save, Loader2, Send } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import type { WizardData, LessonRequirement, TeacherConstraint, SubjectRequirement } from '@/types';
import { type Day, type Lesson } from '@prisma/client';
import { useAppDispatch, useAppSelector } from '@/hooks/redux-hooks';
import { saveSchedule, selectScheduleStatus, setInitialSchedule } from '@/lib/redux/features/schedule/scheduleSlice';

type SchedulableLesson = Omit<Lesson, 'id' | 'createdAt' | 'updatedAt'>;

const ValidationStep: React.FC<{ wizardData: WizardData, onGenerationSuccess: () => void }> = ({ wizardData, onGenerationSuccess }) => {
  const dispatch = useAppDispatch();
  const scheduleStatus = useAppSelector(selectScheduleStatus);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [validationResults, setValidationResults] = useState<ValidationResult[]>([]);
  const [isSaved, setIsSaved] = useState(false);
  const [isGenerated, setIsGenerated] = useState(false);
  
  type ValidationResult = {
    type: 'success' | 'warning' | 'error';
    message: string;
    details?: string;
  }

  const validateData = (): ValidationResult[] => {
    const results: ValidationResult[] = [];

    if (!wizardData.school.name) results.push({ type: 'error', message: 'Nom d\'établissement manquant', details: 'Veuillez renseigner le nom de votre établissement' });
    if (wizardData.classes.length === 0) results.push({ type: 'error', message: 'Aucune classe configurée', details: 'Vous devez créer au moins une classe' });
    if (wizardData.teachers.length === 0) results.push({ type: 'error', message: 'Aucun enseignant configuré', details: 'Vous devez ajouter au moins un enseignant' });
    if (wizardData.subjects.length === 0) results.push({ type: 'error', message: 'Aucune matière configurée', details: 'Vous devez définir au moins une matière' });
    if (wizardData.rooms.length === 0) results.push({ type: 'warning', message: 'Aucune salle configurée', details: 'Recommandé: ajoutez des salles pour optimiser la planification' });
    if (wizardData.lessonRequirements.length === 0) results.push({ type: 'warning', message: 'Volumes horaires non définis', details: 'Les heures par défaut seront utilisées. Il est recommandé de les configurer.' });
    if ((wizardData.teacherConstraints?.length || 0) === 0) results.push({ type: 'success', message: 'Aucune contrainte enseignant', details: 'Tous les enseignants sont considérés comme disponibles.' });

    const totalStudents = wizardData.classes.reduce((sum, cls) => sum + cls.capacity, 0);
    const totalRoomCapacity = wizardData.rooms.reduce((sum, room) => sum + room.capacity, 0);
    
    if (totalRoomCapacity < totalStudents && wizardData.rooms.length > 0) results.push({ type: 'warning', message: 'Capacité des salles insuffisante', details: `Capacité totale: ${totalRoomCapacity}, Élèves: ${totalStudents}` });

    const unassignedSubjects = wizardData.subjects.length > 0 && wizardData.teachers.flatMap(t => t.subjects).length === 0;
    if (unassignedSubjects) results.push({ type: 'warning', message: 'Certaines matières ne sont assignées à aucun professeur', details: 'Vérifiez les affectations des professeurs.'});

    if (results.length === 0 || results.every(r => r.type !== 'error')) {
      results.push({ type: 'success', message: 'Configuration valide', details: 'Toutes les données requises sont correctement configurées.' });
    }

    return results;
  };

  useEffect(() => {
    setValidationResults(validateData());
  }, [wizardData]);

  const generateSchedule = (): SchedulableLesson[] => {
    const newSchedule: SchedulableLesson[] = [];
    const schoolDays = wizardData.school.schoolDays.map(d => d.toUpperCase() as Day);
    if (schoolDays.length === 0) return [];
  
    const timeSlots = ['08:00', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00'];
    const labSubjectKeywords = ['physique', 'informatique', 'sciences', 'technique'];
    const occupancy: { [key: string]: boolean } = {}; // Tracks teacher, class, and room occupancy
  
    wizardData.classes.forEach(classItem => {
      wizardData.subjects.forEach(subject => {
        const requirement = wizardData.lessonRequirements.find(r => r.classId === classItem.id && r.subjectId === subject.id);
        const hoursToSchedule = requirement ? requirement.hours : (subject.weeklyHours || 0);
  
        const potentialTeachers = wizardData.teachers.filter(t => 
          t.subjects.some(s => s.id === subject.id) &&
          (t.classes.length === 0 || t.classes.some(c => c.id === classItem.id))
        );
  
        if (potentialTeachers.length > 0) {
          for (let i = 0; i < hoursToSchedule; i++) {
            let placed = false;
            const shuffledDays = [...schoolDays].sort(() => Math.random() - 0.5);
            const shuffledTimes = [...timeSlots].sort(() => Math.random() - 0.5);
  
            for (const day of shuffledDays) {
              for (const time of shuffledTimes) {
                // Find an available teacher and check if the class is free
                const availableTeacher = potentialTeachers.find(t => !occupancy[`teacher-${t.id}-${day}-${time}`]);
                const isClassAvailable = !occupancy[`class-${classItem.id}-${day}-${time}`];
  
                if (availableTeacher && isClassAvailable) {
                  // Determine the required room type based on subject
                  const subjectNameLower = subject.name.toLowerCase();
                  const isLabSubject = labSubjectKeywords.some(keyword => subjectNameLower.includes(keyword));
                  
                  let potentialRooms: typeof wizardData.rooms = [];
                  if (isLabSubject) {
                    const subjectKeyword = labSubjectKeywords.find(k => subjectNameLower.includes(k));
                    potentialRooms = wizardData.rooms.filter(r => r.name.toLowerCase().includes('labo') && r.name.toLowerCase().includes(subjectKeyword!));
                  } else {
                    potentialRooms = wizardData.rooms.filter(r => !r.name.toLowerCase().includes('labo'));
                  }
  
                  const availableRoom = potentialRooms.find(r => !occupancy[`room-${r.id}-${day}-${time}`]);
                  
                  // A room is only strictly necessary if rooms are configured.
                  if (availableRoom || wizardData.rooms.length === 0) {
                    const [hour, minute] = time.split(':').map(Number);
  
                    newSchedule.push({
                      name: `${subject.name} - ${classItem.name}`,
                      day: day,
                      startTime: new Date(2000, 0, 1, hour, minute).toISOString(),
                      endTime: new Date(2000, 0, 1, hour + 1, minute).toISOString(),
                      subjectId: subject.id,
                      teacherId: availableTeacher.id,
                      classId: classItem.id,
                      classroomId: availableRoom ? availableRoom.id : null,
                    });
  
                    // Update all occupancies
                    occupancy[`teacher-${availableTeacher.id}-${day}-${time}`] = true;
                    occupancy[`class-${classItem.id}-${day}-${time}`] = true;
                    if (availableRoom) {
                      occupancy[`room-${availableRoom.id}-${day}-${time}`] = true;
                    }
                    placed = true;
                  }
                }
                if (placed) break;
              }
              if (placed) break;
            }
          }
        }
      });
    });
    return newSchedule;
  };


  const simulateGeneration = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    const steps = [
      'Analyse des contraintes...', 'Calcul des créneaux disponibles...', 'Assignation des cours...', 
      'Optimisation des emplois du temps...', 'Validation finale...', 'Génération terminée !'
    ];
    for (let i = 0; i < steps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 500));
      setGenerationProgress(((i + 1) / steps.length) * 100);
    }
    const finalSchedule = generateSchedule();
    dispatch(setInitialSchedule(finalSchedule as Lesson[]));
    setIsGenerating(false);
    setIsGenerated(true);
    setIsSaved(false);
    toast({ title: "Génération terminée !", description: "Les emplois du temps ont été générés avec succès. Vous pouvez maintenant les sauvegarder." });
    onGenerationSuccess();
  };
  
  const getValidationIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="text-green-500" size={20} />;
      case 'warning': return <AlertTriangle className="text-yellow-500" size={20} />;
      case 'error': return <AlertTriangle className="text-destructive" size={20} />;
      default: return null;
    }
  };

  const canGenerate = validationResults.every(result => result.type !== 'error');

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <School className="text-primary" size={20} />
          <span>Récapitulatif de la configuration</span>
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <Users size={24} className="mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold text-foreground">{wizardData.classes.length}</p>
            <p className="text-sm text-muted-foreground">Classes</p>
          </div>
          <div className="text-center">
            <BookOpen size={24} className="mx-auto mb-2 text-secondary" />
            <p className="text-2xl font-bold text-foreground">{wizardData.subjects.length}</p>
            <p className="text-sm text-muted-foreground">Matières</p>
          </div>
          <div className="text-center">
            <Calendar size={24} className="mx-auto mb-2 text-accent" />
            <p className="text-2xl font-bold text-foreground">{wizardData.teachers.length}</p>
            <p className="text-sm text-muted-foreground">Enseignants</p>
          </div>
          <div className="text-center">
            <MapPin size={24} className="mx-auto mb-2 text-muted-foreground" />
            <p className="text-2xl font-bold text-foreground">{wizardData.rooms.length}</p>
            <p className="text-sm text-muted-foreground">Salles</p>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <CheckCircle className="text-primary" size={20} />
          <span>Validation de la configuration</span>
        </h3>
        <div className="space-y-3">
          {validationResults.map((result, index) => (
            <Alert key={index} className={`border-l-4 ${result.type === 'success' ? 'border-green-500 bg-green-500/10' : result.type === 'warning' ? 'border-yellow-500 bg-yellow-500/10' : 'border-destructive bg-destructive/10'}`}>
              <div className="flex items-start space-x-3">
                {getValidationIcon(result.type)}
                <div className="flex-1">
                  <AlertDescription>
                    <p className={`font-medium ${result.type === 'success' ? 'text-green-700 dark:text-green-400' : result.type === 'warning' ? 'text-yellow-700 dark:text-yellow-400' : 'text-destructive'}`}>{result.message}</p>
                    {result.details && <p className="text-sm text-muted-foreground mt-1">{result.details}</p>}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          ))}
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Calendar className="text-primary" size={20} />
          <span>Génération des emplois du temps</span>
        </h3>
        {isGenerating ? (
          <div className="space-y-4">
            <Progress value={generationProgress} className="h-3" />
            <div className="flex items-center justify-center space-x-2 text-muted-foreground">
              <Clock size={20} className="animate-spin" />
              <span>Génération en cours... {Math.round(generationProgress)}%</span>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {!canGenerate && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>Veuillez corriger les erreurs de configuration avant de lancer la génération.</AlertDescription>
              </Alert>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button onClick={simulateGeneration} disabled={!canGenerate} className="flex-1" size="lg">
                <Calendar size={20} className="mr-2" />
                Générer l'emploi du temps
              </Button>
            </div>
            {canGenerate && !isGenerated && (
              <div className="p-4 bg-green-500/10 rounded-lg mt-4">
                <p className="text-sm text-green-600 dark:text-green-400">✅ Configuration validée ! La génération peut être lancée.</p>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default ValidationStep;
