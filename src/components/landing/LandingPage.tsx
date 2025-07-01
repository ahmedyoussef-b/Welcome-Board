// src/components/landing/LandingPage.tsx
'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { KeyRound, Shield, User, GraduationCap, Users } from 'lucide-react';
import RoleCard from './RoleCard';
import { useSelector } from 'react-redux';
import { selectIsAuthenticated, selectCurrentUser } from '@/lib/redux/slices/authSlice';

const roles = [
  {
    title: 'Administrateur',
    description: "Gérez les élèves, professeurs, et classes. Générez des emplois du temps optimisés et consultez des rapports détaillés.",
    icon: Shield,
  },
  {
    title: 'Enseignant',
    description: "Gérez vos cours, créez des devoirs et examens, et engagez vos élèves avec des sessions de classe virtuelles interactives via la Chatroom.",
    icon: User,
  },
  {
    title: 'Parent',
    description: "Consultez les emplois du temps, les notes, et les annonces importantes pour tous vos enfants en un seul endroit.",
    icon: Users,
  },
  {
    title: 'Étudiant',
    description: "Consultez votre emploi du temps, voyez vos devoirs et examens, et participez activement aux cours en ligne.",
    icon: GraduationCap,
  },
];

export default function LandingPage() {
    const isAuthenticated = useSelector(selectIsAuthenticated);
    const currentUser = useSelector(selectCurrentUser);
    const locale = 'fr'; // App is French-only now

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-background via-card to-background p-8">
            <main className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-12">
                    <div className="inline-block p-4 bg-primary/10 rounded-full mb-4">
                        <KeyRound className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-5xl md:text-6xl font-bold font-headline text-foreground">
                        Bienvenue sur <span className="text-primary">SchooLama</span>
                    </h1>
                    <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                        Votre plateforme tout-en-un pour une gestion scolaire simplifiée et une expérience d'apprentissage interactive.
                    </p>
                </div>

                <div className="mb-16">
                    <h2 className="text-3xl font-bold text-foreground mb-8">Découvrez les rôles</h2>
                    <div className="flex flex-wrap items-center justify-center gap-8">
                        {roles.map((role) => (
                            <RoleCard
                                key={role.title}
                                title={role.title}
                                description={role.description}
                                icon={role.icon}
                            />
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                  {isAuthenticated && currentUser ? (
                      <Button asChild size="lg" className="text-lg py-6 px-8">
                          <Link href={`/${locale}/${currentUser.role.toLowerCase()}`}>Accéder à mon tableau de bord</Link>
                      </Button>
                  ) : (
                      <Button asChild size="lg" className="text-lg py-6 px-8">
                          <Link href={`/${locale}/login`}>Commencer</Link>
                      </Button>
                  )}
                  <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} SchooLama. Tous droits réservés.</p>
                </div>
            </main>
        </div>
    );
}
