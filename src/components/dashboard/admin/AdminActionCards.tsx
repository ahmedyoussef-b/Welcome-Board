// src/components/dashboard/admin/AdminActionCards.tsx
import Link from "next/link";
import { Wand2, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Role as AppRole } from "@/types";

const adminSections = [
  { 
    title: "Générateur d'Emploi du Temps", 
    href: "/shuddle", 
    icon: Wand2, 
    description: "Lancer l'assistant pour configurer les entités et générer un emploi du temps optimisé.",
    visible: [AppRole.ADMIN]
  },
  { 
    title: "Rapports & Statistiques", 
    href: "/admin/reports", 
    icon: BarChart3, 
    description: "Consulter les rapports détaillés des sessions de chatroom et autres analyses.",
    visible: [AppRole.ADMIN]
  },
];

const AdminActionCards = ({ locale }: { locale: string }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {adminSections.map((section) => (
        <Link href={`/${locale}${section.href}`} key={section.title} className="block group">
          <Card className="h-full shadow-lg hover:shadow-xl hover:border-primary transition-all duration-300 transform hover:-translate-y-1">
            <CardHeader className="flex flex-row items-center gap-4 pb-3">
              <section.icon className="h-8 w-8 text-accent" />
              <CardTitle className="text-xl group-hover:text-primary transition-colors">
                {section.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>{section.description}</CardDescription>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
};

export default AdminActionCards;
