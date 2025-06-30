// src/app/[locale]/(dashboard)/profile/page.tsx
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { User } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="p-4 md:p-6">
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Profil Utilisateur</CardTitle>
              <CardDescription>
                Cette section est en cours de développement.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12 text-muted-foreground">
            <p>La page de profil sera bientôt disponible !</p>
            <p className="text-sm mt-2">Vous pourrez y voir et modifier vos informations personnelles.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
