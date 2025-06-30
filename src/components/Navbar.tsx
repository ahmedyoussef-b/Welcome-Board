// src/components/Navbar.tsx
"use client"; 
import Image from "next/image";
import { AppHeaderLogoutButton } from "./layout/AppHeaderLogoutButton";
import { ThemeToggleButton } from "./layout/ThemeToggleButton";
// LanguageSwitcher n'est plus utilisé
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/lib/redux/slices/authSlice";
import type { SafeUser } from "@/types";
import { useEffect, useState } from "react";

const Navbar = () => {
  // t et useCurrentLocale ne sont plus nécessaires
  const currentUser: SafeUser | null = useSelector(selectCurrentUser);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-between p-4 animate-pulse">
        <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2 h-10 w-64 bg-muted">
        </div>
        <div className="flex items-center gap-2 justify-end w-full">
          <div className="bg-muted rounded-full w-8 h-8"></div>
          <div className="bg-muted rounded-full w-8 h-8"></div>
          {/* Placeholder pour LanguageSwitcher enlevé */}
           <div className="flex flex-col">
            <div className="h-3 w-20 bg-muted rounded mb-1"></div>
            <div className="h-2 w-12 bg-muted rounded self-end"></div>
          </div>
          <div className="h-9 w-9 bg-muted rounded-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4">
      {/* SEARCH BAR */}
      <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-border px-2">
        <Image src="/search.png" alt="recherche" width={14} height={14} />
        <input
          type="text"
          placeholder="Rechercher..." // Texte français direct
          className="w-[200px] p-2 bg-transparent outline-none"
        />
      </div>
      {/* ICONS AND USER */}
      <div className="flex items-center gap-2 md:gap-4 justify-end w-full">
        <ThemeToggleButton />
        {/* LanguageSwitcher retiré */}
        <div className="bg-card border rounded-full w-8 h-8 flex items-center justify-center cursor-pointer">
          <Image src="/message.png" alt="messages" width={18} height={18} /> {/* Texte français direct */}
        </div>
        <div className="bg-card border rounded-full w-8 h-8 flex items-center justify-center cursor-pointer relative">
          <Image src="/announcement.png" alt="annonces" width={18} height={18} /> {/* Texte français direct */}
          <div className="absolute -top-2 -right-2 w-4 h-4 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-[10px]">
            1
          </div>
        </div>
        {currentUser ? (
          <>
            <div className="flex flex-col">
              <span className="text-xs leading-3 font-medium">{currentUser.name || currentUser.email}</span>
              <span className="text-[10px] text-muted-foreground text-right capitalize">
                {currentUser.role.toLowerCase()}
              </span>
            </div>
            <AppHeaderLogoutButton /> 
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Non connecté</span> /* Texte français direct */
        )}
      </div>
    </div>
  );
};

export default Navbar;
