
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
    <div className="h-screen flex items-center justify-center p-4 relative overflow-hidden bg-background">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/20 blur-[100px] rounded-full" />

      <div className="w-full max-w-[340px] relative z-10 space-y-4">
        <div className="text-center space-y-0.5">
          <div className="mx-auto w-14 h-14 rounded-[1.6rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl shadow-primary/20">
            <Sparkles className="text-white w-7 h-7" />
          </div>
          <h1 className="text-2xl font-headline font-bold tracking-tight text-foreground pt-2">NutriScan</h1>
          <p className="text-muted-foreground font-medium text-[10px] uppercase tracking-widest opacity-60">Bienvenido de nuevo</p>
        </div>

        <Card className="glass border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="space-y-0.5 pb-0 pt-6 px-6">
            <CardTitle className="text-lg font-headline font-bold">Entrar</CardTitle>
          </CardHeader>
          <form onSubmit={handleLogin}>
            <CardContent className="space-y-3 px-6 pt-4 pb-4">
              <div className="space-y-1">
                <Label className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input 
                    type="email" 
                    placeholder="tu@email.com" 
                    className="glass pl-9 h-10 rounded-xl border-white/5 focus:border-primary/40 transition-all text-sm" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between items-center px-1">
                  <Label className="text-[8px] font-bold uppercase tracking-[0.2em] text-muted-foreground">Clave</Label>
                  <Link href="/forgot-password" hidden={false} className="text-[7px] font-bold text-primary hover:text-accent transition-colors uppercase tracking-widest">
                    Olvidé
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input 
                    type="password" 
                    placeholder="••••••••" 
                    className="glass pl-9 h-10 rounded-xl border-white/5 focus:border-primary/40 transition-all text-sm" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit"
                className="w-full h-11 text-sm font-bold bg-primary hover:bg-primary/90 mt-1 rounded-xl shadow-xl shadow-primary/20 ios-btn" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2 h-4 w-4" />
                ) : (
                  <>
                    <span>Entrar</span>
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col gap-2 border-t border-white/5 pt-4 pb-6">
            <p className="text-[10px] text-muted-foreground font-medium">
              ¿Sin cuenta? <Link href="/register" className="text-primary font-bold hover:underline">Regístrate</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
