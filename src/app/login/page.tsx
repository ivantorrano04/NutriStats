
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Sparkles, Mail, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

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
        description: 'Credenciales incorrectas o usuario no encontrado.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="animate-spin text-primary w-12 h-12" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Elementos decorativos de fondo Premium */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[120px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="mx-auto w-24 h-24 rounded-[2.5rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30 animate-float">
            <Sparkles className="text-white w-12 h-12" />
          </div>
          <h1 className="text-5xl font-headline font-bold tracking-tighter text-foreground pt-4">NutriScan</h1>
          <p className="text-muted-foreground font-medium text-lg">Tu viaje hacia la salud comienza aquí</p>
        </div>

        <Card className="glass border-none shadow-[0_50px_100px_rgba(0,0,0,0.3)] dark:shadow-[0_50px_100px_rgba(0,0,0,0.5)] rounded-[3.5rem] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <CardHeader className="space-y-1 pb-2 pt-10 px-10">
            <CardTitle className="text-3xl font-headline font-bold">Iniciar Sesión</CardTitle>
            <CardDescription className="text-sm font-medium opacity-70">Bienvenido de nuevo a tu comunidad</CardDescription>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-6 px-10 pb-8">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input 
                    type="email" 
                    placeholder="tu@email.com" 
                    className="glass pl-12 h-16 rounded-2xl border-white/10 focus:border-primary/50 transition-all text-lg font-medium" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Contraseña</Label>
                  <Link href="/forgot-password" hidden={false} className="text-[10px] font-bold text-primary hover:text-accent transition-colors uppercase tracking-widest">
                    ¿La olvidaste?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="glass pl-12 h-16 rounded-2xl border-white/10 focus:border-primary/50 transition-all text-lg font-medium" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit"
                className="w-full h-18 text-xl font-bold bg-primary hover:bg-primary/90 mt-4 rounded-[2rem] shadow-2xl shadow-primary/30 group ios-btn transition-all py-8" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <>
                    <span>Entrar ahora</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col gap-4 border-t border-white/10 pt-8 pb-10">
            <p className="text-sm text-muted-foreground font-medium">
              ¿Eres nuevo? <Link href="/register" className="text-primary font-bold hover:text-accent transition-colors hover:underline underline-offset-4">Regístrate gratis</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
