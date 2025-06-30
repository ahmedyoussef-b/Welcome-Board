
// src/components/Menu.tsx
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-utils";
import { Role } from "@/types/index";
import { BarChart3 } from 'lucide-react'; // Utiliser une icône pour les rapports

const menuItems: Array<{
  title: string;
  items: Array<{
    icon: string;
    label: string;
    href: string;
    visible: Role[]; 
  }>;
}> = [
  {
    title: "MENU",
    items: [
      {
        icon: "/home.png",
        label: "Accueil",
        href: "/", 
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
       {
        icon: "/calendar.png",
        label: "Planificateur",
        href: "/shuddle",
        visible: [Role.ADMIN],
      },
      {
        icon: "/exam.png", // Utilisation d'une icône existante qui ressemble à un rapport
        label: "Rapports",
        href: "/admin/reports",
        visible: [Role.ADMIN],
      },
      {
        icon: "/teacher.png",
        label: "Enseignants",
        href: "/list/teachers",
        visible: [Role.ADMIN, Role.TEACHER],
      },
      {
        icon: "/student.png",
        label: "Étudiants",
        href: "/list/students",
        visible: [Role.ADMIN, Role.TEACHER],
      },
      {
        icon: "/parent.png",
        label: "Parents",
        href: "/list/parents",
        visible: [Role.ADMIN, Role.TEACHER],
      },
      {
        icon: "/subject.png",
        label: "Matières",
        href: "/list/subjects",
        visible: [Role.ADMIN],
      },
      {
        icon: "/class.png",
        label: "Classes",
        href: "/list/classes",
        visible: [Role.ADMIN, Role.TEACHER],
      },
      {
        icon: "/lesson.png",
        label: "Cours",
        href: "/list/lessons",
        visible: [Role.ADMIN, Role.TEACHER], 
      },
      {
        icon: "/exam.png",
        label: "Examens",
        href: "/list/exams",
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        icon: "/assignment.png",
        label: "Devoirs",
        href: "/list/assignments",
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        icon: "/result.png",
        label: "Résultats",
        href: "/list/results",
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        icon: "/attendance.png",
        label: "Présence",
        href: "/list/attendance", 
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        icon: "/calendar.png",
        label: "Événements",
        href: "/list/events",
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        icon: "/message.png",
        label: "Chatroom",
        href: "/list/chatroom",
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT]
      },
      {
        icon: "/announcement.png",
        label: "Annonces",
        href: "/list/announcements",
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
    ],
  },
  {
    title: "AUTRE",
    items: [
      {
        icon: "/profile.png",
        label: "Profil",
        href: "/profile", 
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
      {
        icon: "/setting.png",
        label: "Paramètres",
        href: "/settings", 
        visible: [Role.ADMIN, Role.TEACHER, Role.STUDENT, Role.PARENT],
      },
    ],
  },
];

const Menu = async () => {
  const session = await getServerSession();
  const userRole = session?.role as Role | undefined; 
  const locale = 'fr'; // Locale fixée à 'fr'

  if (!userRole) {
    return null; 
  }

  return (
    <div className="mt-4 text-sm">
      {menuItems.map((group) => (
        <div className="flex flex-col gap-2" key={group.title}>
          <span className="hidden lg:block text-sidebar-foreground/70 font-light my-4">
            {group.title}
          </span>
          {group.items.map((item) => {
            if (item.visible.includes(userRole)) {
              // Construct the href with the resolved locale
              const baseHref = item.href === "/" && userRole ? `/${userRole.toLowerCase()}` : item.href;
              const finalHref = `/${locale}${baseHref.startsWith('/') ? '' : '/'}${baseHref}`;
              
              return (
                <Link
                  href={finalHref} 
                  key={item.label}
                  className="glow-on-hover flex items-center justify-center lg:justify-start gap-4 py-3 md:px-2"
                >
                  <Image src={item.icon} alt={item.label} width={20} height={20} />
                  <span className="hidden lg:block">{item.label}</span>
                </Link>
              );
            }
            return null;
          })}
        </div>
      ))}
    </div>
  );
};

export default Menu;
