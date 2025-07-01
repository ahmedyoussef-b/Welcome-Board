// src/components/classes/GradeCard.tsx
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import FormContainer from '@/components/FormContainer';
import { Role as AppRole, type Grade } from "@/types/index";

type GradeWithClassCount = Grade & {
  _count: { classes: number };
};

interface GradeCardProps {
    grade: GradeWithClassCount;
    locale: string;
    userRole?: AppRole;
}

const GradeCard: React.FC<GradeCardProps> = ({ grade, locale, userRole }) => {
    return (
        <Card className="hover:shadow-xl transition-shadow duration-300 bg-card hover:bg-muted/30 h-full flex flex-col relative group">
            <Link href={`/${locale}/list/classes?viewGradeId=${grade.id}`} passHref className="flex flex-col flex-grow">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xl text-primary">
                        {`Niveau ${grade.level}`}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-grow">
                    <p className="text-muted-foreground">
                        {`${grade._count.classes} Classe(s)`}
                    </p>
                </CardContent>
                <CardFooter>
                    <Button variant="secondary" size="sm" className="w-full">
                        Voir les Classes
                    </Button>
                </CardFooter>
            </Link>
            {userRole === AppRole.ADMIN && (
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <FormContainer table="grade" type="delete" id={grade.id} />
                </div>
            )}
        </Card>
    );
};

export default GradeCard;
