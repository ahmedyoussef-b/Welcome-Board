// src/app/[locale]/(dashboard)/admin/page.tsx
import Announcements from "@/components/Announcements";
import AttendanceChartContainer from "@/components/AttendanceChartContainer";
import CountChartContainer from "@/components/CountChartContainer";
import EventCalendarContainer from "@/components/EventCalendarContainer";
import FinanceChart from "@/components/FinanceChart";
import UserCard from "@/components/UserCard";
import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import { Role as AppRole } from "@/types";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import Link from "next/link";
import { Wand2, Puzzle, BarChart3, Settings } from "lucide-react";

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

const AdminPage = async ({
  searchParams,
}: {
  searchParams: { [keys: string]: string | string[] | undefined };
}) => {
  const locale = 'fr';
  let session;
  try {
    session = await getServerSession();
  } catch (error) {
    console.error("👑 AdminPage: Erreur critique lors de l'appel à getServerSession:", error);
    redirect(`/${locale}/login`);
    return;
  }

  if (!session || !session.isAuthenticated || session.role !== AppRole.ADMIN) {
    redirect(session && session.isAuthenticated && session.role ? `/${locale}/${(session.role as AppRole).toLowerCase()}` : `/${locale}/login`);
    return;
  }

  return (
    <div className="p-4 flex flex-col gap-6">
      {/* Page Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center">
            <Settings className="mr-3 h-8 w-8" />
            Panneau d'Administration
          </h1>
          <p className="text-lg text-muted-foreground mt-1">
            Gérez les paramètres avancés et les outils de planification.
          </p>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          {format(new Date(), 'EEEE, dd MMMM yyyy', { locale: fr })}
        </div>
      </div>
      
      {/* Action Cards */}
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

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left & Center Column (Spans 2) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <UserCard type={AppRole.ADMIN} bgColorClass="bg-sky-500" />
            <UserCard type={AppRole.TEACHER} bgColorClass="bg-teal-500" />
            <UserCard type={AppRole.STUDENT} bgColorClass="bg-amber-700" />
            <UserCard type={AppRole.PARENT} bgColorClass="bg-purple-500" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-1 h-[450px]">
              <CountChartContainer />
            </div>
            <div className="xl:col-span-2 h-[450px]">
              <AttendanceChartContainer />
            </div>
          </div>

          <div className="h-[500px]">
            <FinanceChart />
          </div>
        </div>

        {/* Right Column (Spans 1) */}
        <div className="lg:col-span-1 grid grid-rows-[auto_1fr] gap-6">
          <EventCalendarContainer date={(await searchParams).date}/>
          <div className="min-h-0">
            <Announcements />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
