// src/components/auth/LoginForm.tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLoginMutation } from "@/lib/redux/api/authApi";
import { useToast } from "@/hooks/use-toast";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { SerializedError } from '@reduxjs/toolkit';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { Spinner } from "@/components/ui/spinner";
// useI18n, useCurrentLocale ne sont plus nécessaires

const loginSchema = z.object({
  email: z.string().email({ message: "Adresse e-mail invalide." }), // Message en français
  password: z.string().min(6, { message: "Le mot de passe doit contenir au moins 6 caractères." }), // Message en français
});

type LoginFormData = z.infer<typeof loginSchema>;

interface ApiErrorData {
  message: string;
}

function isFetchBaseQueryError(error: unknown): error is FetchBaseQueryError {
  return typeof error === 'object' && error != null && 'status' in error;
}

function isSerializedError(error: unknown): error is SerializedError {
  return typeof error === 'object' && error != null && 'message' in error;
}

export function LoginForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const [login, { isLoading, isSuccess, isError, error: loginErrorData }] = useLoginMutation();
  const { toast } = useToast();
  const router = useRouter(); 
  // t et locale ne sont plus nécessaires

  useEffect(() => {
    if (isSuccess) {
      toast({
        title: "Connexion réussie", // Texte en français
        description: "Vous êtes maintenant connecté. Redirection...", // Texte en français
      });
    }
    if (isError && loginErrorData) {
      let title = "Échec de la connexion"; // Texte en français
      let description = "Une erreur inattendue s'est produite lors de la connexion."; // Texte en français

       if (isFetchBaseQueryError(loginErrorData)) {
        const errorData = loginErrorData.data as ApiErrorData;
        if (loginErrorData.status === 401 && errorData?.message === "Invalid credentials") {
          title = "Identifiants invalides"; // Texte en français
          description = "Veuillez vérifier votre e-mail et votre mot de passe et réessayer."; // Texte en français
        } else {
          description = errorData?.message || `Erreur: ${loginErrorData.status}`;
        }
      } else if (isSerializedError(loginErrorData)) {
        description = loginErrorData.message || "Un problème est survenu lors de la connexion."; // Texte en français
      }
      toast({
        variant: "destructive",
        title: title,
        description: description,
      });
    }
  }, [isSuccess, isError, loginErrorData, toast, router]);

  const onSubmit = async (data: LoginFormData) => {
    await login(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label> {/* Texte français direct */}
        <Input
          id="email"
          type="email"
          placeholder="vous@exemple.com"
          {...register("email")}
          aria-invalid={errors.email ? "true" : "false"}
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Mot de passe</Label> {/* Texte français direct */}
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          {...register("password")}
          aria-invalid={errors.password ? "true" : "false"}
          className={errors.password ? "border-destructive" : ""}
        />
        {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
        {isLoading ? "Connexion..." : "Se connecter"} {/* Texte français direct */}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Pas encore de compte ?{" "} {/* Texte français direct */}
        <Link href={`/fr/register`} className="font-medium text-primary hover:underline">
          S'inscrire {/* Texte français direct */}
        </Link>
      </p>
    </form>
  );
}
