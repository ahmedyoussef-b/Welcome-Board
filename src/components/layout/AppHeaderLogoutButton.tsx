
"use client";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useLogoutMutation } from "@/lib/redux/api/authApi";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';

interface ApiErrorData {
  message: string;
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

function isSerializedError(error: unknown): error is SerializedError {
  return typeof error === 'object' && error != null && 'message' in error;
}

export function AppHeaderLogoutButton() {
  const [logout, { isLoading: logoutLoading, isSuccess: logoutSuccess, isError: logoutIsError, error: logoutErrorData }] = useLogoutMutation();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (logoutSuccess) {
      toast({ title: "Déconnexion réussie", description: "Vous avez été déconnecté avec succès." });
      router.push('/fr'); // Redirect to home page after successful logout
      router.refresh(); // Force refresh to ensure server session is cleared
    }
    if (logoutIsError) {
      let errorMessage = "Impossible de vous déconnecter correctement.";
      if (isFetchBaseQueryError(logoutErrorData)) {
        const errorData = logoutErrorData.data as ApiErrorData;
        errorMessage = errorData?.message || `Erreur ${logoutErrorData.status}`;
      } else if (isSerializedError(logoutErrorData)) {
        errorMessage = logoutErrorData.message || "Une erreur sérialisée s'est produite lors de la déconnexion.";
      }
      toast({ variant: "destructive", title: "Échec de la déconnexion", description: errorMessage });
      // Still push to home page as a fallback, authSlice should clear user data
      router.push('/fr');
      router.refresh();
    }
  }, [logoutSuccess, logoutIsError, logoutErrorData, router, toast]);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <Button variant="outline" size="sm" onClick={handleLogout} disabled={logoutLoading} className="h-9 w-9 p-0 rounded-full md:h-auto md:w-auto md:px-3 md:py-2">
      {logoutLoading ? (
        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      ) : (
        <LogOut className="h-4 w-4" />
      )}
      <span className="hidden md:inline md:ml-2">Déconnexion</span>
    </Button>
  );
}
