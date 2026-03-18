"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { Loader2, Sparkles } from 'lucide-react';

export default function Landing() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();

  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(profileRef);

  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Si la autenticación ha terminado de cargar
    if (!isUserLoading) {
      if (!user) {
        // No hay usuario -> Registrarse
        router.push('/register');
        setChecking(false);
      } else {
        // Hay usuario, esperamos a que cargue el perfil antes de decidir
        if (!isProfileLoading) {
          if (!profile) {
            // Usuario autenticado pero sin perfil en Firestore
            router.push('/onboarding');
          } else {
            // Todo ok
            router.push('/dashboard');
          }
          setChecking(false);
        }
      }
    }
  }, [user, isUserLoading, profile, isProfileLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 space-y-6 overflow-hidden h-screen">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-bounce shadow-2xl shadow-primary/20">
          <Sparkles className="text-white w-10 h-10" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-headline font-bold tracking-tighter text-foreground">NutriScan</h1>
        <p className="text-muted-foreground font-medium animate-pulse text-sm">Validando biometría...</p>
      </div>
      <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />
    </div>
  );
}