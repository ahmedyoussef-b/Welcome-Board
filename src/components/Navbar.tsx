// src/components/Navbar.tsx
"use client"; 
import Image from "next/image";
import Link from 'next/link';
import { AppHeaderLogoutButton } from "./layout/AppHeaderLogoutButton";
import { ThemeToggleButton } from "./layout/ThemeToggleButton";
import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import NotificationDropdown from './NotificationDropdown';
import { useSelector } from "react-redux";
import { selectCurrentUser } from "@/lib/redux/slices/authSlice";
import { selectUnreadCount } from '@/lib/redux/slices/notificationSlice';
import type { SafeUser } from "@/types";
import { useEffect, useState } from "react";

const Navbar = () => {
  const currentUser: SafeUser | null = useSelector(selectCurrentUser);
  const unreadNotifications = useSelector(selectUnreadCount);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-between p-4 animate-pulse">
        <div className="hidden md:flex items-center gap-2 text-xs rounded-full ring-[1.5px] ring-gray-300 px-2 h-10 w-64 bg-muted">
        </div>
        <div className="flex items-center gap-2 md:gap-4 justify-end w-full">
          <div className="bg-muted rounded-full w-8 h-8"></div>
          <div className="bg-muted rounded-full w-8 h-8"></div>
          <div className="bg-muted rounded-full w-8 h-8"></div>
          <div className="flex flex-col text-right">
            <div className="h-4 w-24 bg-muted rounded mb-1"></div>
            <div className="h-3 w-16 bg-muted rounded"></div>
          </div>
          <div className="h-10 w-10 bg-muted rounded-full"></div>
          <div className="h-9 w-9 md:h-9 md:w-24 bg-muted rounded-full md:rounded-md"></div>
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
        
        <Link href="/fr/list/messages" className="bg-card border rounded-full w-8 h-8 flex items-center justify-center cursor-pointer">
            <Image src="/mail.png" alt="messages" width={18} height={18} />
        </Link>
        
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="bg-card border rounded-full w-8 h-8 flex items-center justify-center cursor-pointer relative">
                    <Image src="/announcement.png" alt="annonces" width={18} height={18} />
                    {unreadNotifications > 0 && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center bg-primary text-primary-foreground rounded-full text-[10px] animate-pulse">
                            {unreadNotifications}
                        </div>
                    )}
                </button>
            </DropdownMenuTrigger>
            <NotificationDropdown />
        </DropdownMenu>

        {currentUser ? (
          <>
            <div className="flex flex-col text-right">
              <span className="text-sm font-semibold">{currentUser.name || currentUser.email}</span>
              <span className="text-xs text-muted-foreground capitalize">
                {currentUser.role.toLowerCase()}
              </span>
            </div>
             <Image
                src={currentUser.img || `https://api.dicebear.com/7.x/avataaars/svg?seed=${currentUser.email}`}
                alt="Photo de profil"
                width={40}
                height={40}
                className="rounded-full"
              />
            <AppHeaderLogoutButton /> 
          </>
        ) : (
          <span className="text-xs text-muted-foreground">Non connecté</span>
        )}
      </div>
    </div>
  );
};

export default Navbar;
