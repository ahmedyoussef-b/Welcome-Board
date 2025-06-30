// src/app/[locale]/page.tsx
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Spinner } from '@/components/ui/spinner';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectIsAuthLoading, selectCurrentUser } from '@/lib/redux/slices/authSlice';

export default function HomePage() {
  const isAuthenticated = useSelector(selectIsAuthenticated);
  const isLoadingAuth = useSelector(selectIsAuthLoading);
  const currentUser = useSelector(selectCurrentUser);
  const router = useRouter();

  useEffect(() => {
    if (!isLoadingAuth) {
      if (isAuthenticated && currentUser) {
        const rolePath = currentUser.role.toLowerCase();
        router.replace(`/${rolePath}`); 
      } else {
        router.replace('/login'); 
      }
    }
  }, [isAuthenticated, isLoadingAuth, currentUser, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <Spinner size="lg" />
      <p className="ml-4 text-lg text-muted-foreground font-headline mt-4">
        {isLoadingAuth ? "Chargement de l'application..." : "Redirection..."}
      </p>
    </div>
  );
}
