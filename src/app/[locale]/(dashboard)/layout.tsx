// src/app/[locale]/(dashboard)/layout.tsx
import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { getServerSession } from "@/lib/auth-utils";
import { redirect } from "next/navigation";
import type { Role } from "@/types/index";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = 'fr'; // Locale fixée à 'fr'
  let session;
  try {
    session = await getServerSession();
  } catch (error) {
    console.error("🖼️ DashboardLayout: Erreur critique lors de l'appel à getServerSession:", error);
    redirect(`/${locale}/login`);
    return;
  }

  if (!session || !session.isAuthenticated || !session.role) {
    redirect(`/${locale}/login`);
    return;
  }

  const rolePath = (session.role as Role).toLowerCase();

  return (
    <div className="h-screen flex overflow-hidden">
      {/* LEFT */}
      <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4 bg-sidebar text-sidebar-foreground flex flex-col overflow-y-auto no-print">
        <Link
          href={`/${locale}/${rolePath}`} 
          className="flex items-center justify-center lg:justify-start gap-2 flex-shrink-0"
        >
          <Image src="/logo.png" alt="logo" width={32} height={32} data-ai-hint="logo company" priority />
          <span className="hidden lg:block font-bold text-sidebar-primary-foreground">SchooLama</span>
        </Link>
        <Menu />
      </div>
      {/* RIGHT */}
      <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-background overflow-y-auto flex flex-col">
        <div className="no-print">
          <Navbar />
        </div>
        <main className="flex-grow">
         {children}
        </main>
      </div>
    </div>
  );
}
