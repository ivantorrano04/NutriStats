
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function LoginPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push('/dashboard');
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error de acceso',
        description: 'Credenciales incorrectas.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-10 h-10" />
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex items-center justify-center p-6 relative overflow-hidden bg-background">
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/20 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-accent/20 blur-[120px] rounded-full" />

      <div className="w-full max-w-[400px] relative z-10 space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 rounded-[1.8rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <h1 className="text-3xl font-headline font-bold tracking-tight text-foreground pt-2">NutriScan</h1>
          <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-widest opacity-60">Bienvenido de nuevo</p>
        </div>

        <Card className="glass border-none shadow-[0_50px_100px_rgba(0,0,0,0.3)] dark:shadow-[0_50px_100px_rgba(0,0,0,0.5)] rounded-[3rem] overflow-hidden">
          <CardHeader className="space-y-1 pb-0 pt-8 px-8">
            <CardTitle className="text-xl font-headline font-bold">Iniciar Sesión</CardTitle>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-4 px-8 pt-6 pb-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Correo Electrónico</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input 
                    type="email" 
                    placeholder="tu@email.com" 
                    className="glass pl-11 h-12 rounded-2xl border-white/10 focus:border-primary/50 transition-all text-sm font-medium" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Contraseña</Label>
                  <Link href="/forgot-password" hidden={false} className="text-[9px] font-bold text-primary hover:text-accent transition-colors uppercase tracking-widest">
                    ¿La olvidaste?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="glass pl-11 h-12 rounded-2xl border-white/10 focus:border-primary/50 transition-all text-sm font-medium" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit"
                className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 mt-2 rounded-2xl shadow-2xl shadow-primary/20 ios-btn" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2 h-5 w-5" />
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col gap-2 border-t border-white/5 pt-6 pb-8">
            <p className="text-xs text-muted-foreground font-medium">
              ¿Aún no tienes cuenta? <Link href="/register" className="text-primary font-bold hover:underline">Regístrate gratis</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
