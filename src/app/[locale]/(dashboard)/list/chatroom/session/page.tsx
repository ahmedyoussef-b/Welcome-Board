'use client';

import { useAppSelector } from '@/hooks/redux-hooks';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import SessionRoom from '@/components/chatroom/session/SessionRoom';

export default function SessionPage() {
    const { activeSession } = useAppSelector(state => state.session);

    if (!activeSession) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Card className="w-full max-w-md shadow-lg">
                    <CardHeader className="text-center">
                        <CardTitle>Aucune session active</CardTitle>
                        <CardDescription>
                            Veuillez démarrer une session depuis le tableau de bord.
                        </CardDescription>
                    </CardHeader>
                </Card>
            </div>
        );
    }

    return <SessionRoom />;
}
