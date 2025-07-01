// src/components/classes/ClassCard.tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { Teacher } from '@/types/index';

type ClassWithDetails = {
    id: number;
    name: string;
    capacity: number;
    supervisor: Pick<Teacher, 'name' | 'surname'> | null;
    _count: { students: number };
};

interface ClassCardProps {
    classItem: ClassWithDetails;
    locale: string;
}

const ClassCard: React.FC<ClassCardProps> = ({ classItem, locale }) => {
    return (
        <Link href={`/${locale}/list/classes/${classItem.id}`} passHref>
            <Card className="hover:shadow-lg transition-shadow duration-200 cursor-pointer h-full flex flex-col">
                <CardHeader>
                    <CardTitle className="text-primary">{classItem.name}</CardTitle>
                    {classItem.supervisor && (
                        <CardDescription className="text-xs">
                            Superviseur: {classItem.supervisor.name} {classItem.supervisor.surname}
                        </CardDescription>
                    )}
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-sm text-muted-foreground">
                        Étudiants: {classItem._count.students} / {classItem.capacity}
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="link" className="p-0 h-auto text-sm">Voir Détails</Button>
                </CardFooter>
            </Card>
        </Link>
    );
};

export default ClassCard;
