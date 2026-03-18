
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

  // Cargamos el perfil solo si hay usuario
  const profileRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc<any>(profileRef);

  const [debugMessages, setDebugMessages] = useState<string[]>([]);

  // Global error catcher for visual debugging on device (shows alerts and a small overlay)
  useEffect(() => {
    const handleWindowError = (message: any, source?: string, lineno?: number, colno?: number, error?: Error) => {
      const text = `Error: ${message} at ${source || 'unknown'}:${lineno || 0}:${colno || 0} ${error?.message || ''}`;
      try { alert(text); } catch {}
      setDebugMessages(prev => [text, ...prev].slice(0, 10));
      // Return false to let the default handler run as well
      return false;
    };

    const handleRejection = (ev: PromiseRejectionEvent) => {
      const text = `UnhandledRejection: ${String(ev.reason)}`;
      try { alert(text); } catch {}
      setDebugMessages(prev => [text, ...prev].slice(0, 10));
    };

    // @ts-ignore - window handlers exist in browser env
    window.onerror = handleWindowError;
    window.addEventListener('unhandledrejection', handleRejection as EventListener);

    return () => {
      // cleanup
      // @ts-ignore
      window.onerror = null;
      window.removeEventListener('unhandledrejection', handleRejection as EventListener);
    };
  }, []);

  useEffect(() => {
    // Wrap sync logic in try/catch and show alert on error for visual debugging
    try {
      if (!isUserLoading) {
        if (!user) {
          // No hay sesión -> Mandar a Registro por defecto
          router.push('/register');
        } else if (!isProfileLoading) {
          if (!profile) {
            // Sesión iniciada pero sin datos físicos -> Onboarding
            router.push('/onboarding');
          } else {
            // Todo listo -> Dashboard
            router.push('/dashboard');
          }
        }
      }

      // Verify location.href for issues in .app/.ipa
      try {
        const href = window.location.href;
        // If href is empty or starts with file:// or about:blank, warn the user
        const devHost = process.env.NEXT_PUBLIC_DEV_HOST || '';
        if (!href || href.startsWith('file:') || href.startsWith('about:') || (devHost && href.includes(devHost))) {
          const text = `Warning: current location is ${href}`;
          try { alert(text); } catch {}
          setDebugMessages(prev => [text, ...prev].slice(0, 10));
        }
      } catch (e) {
        const text = `Error checking location.href: ${String(e)}`;
        try { alert(text); } catch {}
        setDebugMessages(prev => [text, ...prev].slice(0, 10));
      }
    } catch (err: any) {
      const text = `Sync error: ${err?.message || String(err)}`;
      try { alert(text); } catch {}
      setDebugMessages(prev => [text, ...prev].slice(0, 10));
    }
  }, [user, isUserLoading, profile, isProfileLoading, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background p-6 space-y-6">
      <div className="relative">
        <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
        <div className="relative w-24 h-24 rounded-[2rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center animate-bounce shadow-2xl shadow-primary/20">
          <Sparkles className="text-white w-10 h-10" />
        </div>
      </div>
      <div className="text-center space-y-2">
        <h1 className="text-4xl font-headline font-bold tracking-tighter text-foreground">NutriScan</h1>
        <p className="text-muted-foreground font-medium animate-pulse">Sincronizando tu experiencia...</p>
      </div>
      <Loader2 className="w-6 h-6 animate-spin text-primary opacity-50" />

      {/* Visual debug overlay (shows recent errors) */}
      {debugMessages.length > 0 && (
        <div style={{ position: 'fixed', bottom: 12, left: 12, right: 12, zIndex: 9999 }}>
          <div className="glass p-3 rounded-xl border border-destructive/20">
            <strong className="text-sm">Debug</strong>
            <ul className="text-xs mt-2 max-h-40 overflow-auto">
              {debugMessages.map((m, i) => (
                <li key={i} className="py-1 border-b border-border/20">{m}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
