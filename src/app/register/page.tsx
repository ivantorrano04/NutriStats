
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useUser } from '@/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Sparkles, User, Mail, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function RegisterPage() {
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isUserLoading, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) return;
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      router.push('/onboarding');
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error de registro',
        description: err.message || 'No se pudo crear la cuenta.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (isUserLoading || user) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-[-15%] right-[-15%] w-[50%] h-[50%] bg-primary/20 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-15%] left-[-15%] w-[50%] h-[50%] bg-accent/20 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-md relative z-10 space-y-8">
        <div className="text-center space-y-2 animate-in fade-in slide-in-from-top-4 duration-1000">
          <div className="mx-auto w-20 h-20 rounded-[2.5rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30 animate-float">
            <Sparkles className="text-white w-10 h-10" />
          </div>
          <h1 className="text-5xl font-headline font-bold tracking-tighter text-foreground pt-4">NutriScan</h1>
          <p className="text-muted-foreground font-medium">Tu nueva vida comienza aquí</p>
        </div>

        <Card className="glass border-none shadow-[0_50px_100px_rgba(0,0,0,0.4)] rounded-[3rem] overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
          <CardHeader className="space-y-1 pb-2">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-emerald-500">Cuenta Protegida</span>
            </div>
            <CardTitle className="text-2xl font-headline font-bold">Registro</CardTitle>
            <CardDescription className="text-xs font-medium opacity-70">Únete a la comunidad de biohacking nutricional</CardDescription>
          </CardHeader>
          <form onSubmit={handleRegister}>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Nombre Completo</Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input 
                    placeholder="Ej. Iván Guerrero" 
                    className="glass pl-12 h-14 rounded-2xl border-white/5 focus:border-primary/50 transition-all text-lg font-medium" 
                    value={name}
                    onChange={e => setName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Email</Label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input 
                    type="email" 
                    placeholder="tu@email.com" 
                    className="glass pl-12 h-14 rounded-2xl border-white/5 focus:border-primary/50 transition-all text-lg font-medium" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Contraseña</Label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground transition-colors group-focus-within:text-primary" />
                  <Input 
                    type="password" 
                    placeholder="Mínimo 6 caracteres" 
                    className="glass pl-12 h-14 rounded-2xl border-white/5 focus:border-primary/50 transition-all text-lg font-medium" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              </div>
              <Button 
                type="submit"
                className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 mt-6 rounded-[1.5rem] shadow-2xl shadow-primary/30 group ios-btn transition-all relative overflow-hidden" 
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="animate-spin mr-2" />
                ) : (
                  <>
                    <span>Empezar Gratis</span>
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </Button>
            </CardContent>
          </form>
          <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-8 pb-10">
            <p className="text-sm text-muted-foreground font-medium">
              ¿Ya eres usuario? <Link href="/login" className="text-primary font-bold hover:text-accent transition-colors hover:underline underline-offset-4">Inicia sesión</Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
