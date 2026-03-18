
"use client";

import { useState } from 'react';
import { useAuth } from '@/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Loader2, Sparkles, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setSent(true);
      toast({
        title: 'Correo enviado',
        description: 'Revisa tu bandeja de entrada para restablecer tu contraseña.',
      });
    } catch (err: any) {
      console.error(err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No pudimos procesar tu solicitud. Verifica el email.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/10 blur-[150px] rounded-full animate-pulse" />
      
      <div className="w-full max-w-md relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <div className="text-center space-y-2">
          <div className="mx-auto w-20 h-20 rounded-[2rem] bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-2xl shadow-primary/30 animate-float">
            <Sparkles className="text-white w-10 h-10" />
          </div>
          <h1 className="text-4xl font-headline font-bold tracking-tighter text-foreground pt-4">NutriScan</h1>
          <p className="text-muted-foreground font-medium">Recuperar acceso</p>
        </div>

        <Card className="glass border-none shadow-[0_50px_100px_rgba(0,0,0,0.4)] rounded-[3rem] overflow-hidden">
          <CardHeader className="text-center space-y-1">
            <CardTitle className="text-2xl font-headline font-bold">Contraseña</CardTitle>
            <CardDescription className="text-xs font-medium opacity-70">Te enviaremos un enlace de recuperación</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 pt-4">
            {!sent ? (
              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Email de tu cuenta</Label>
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
                <Button 
                  type="submit"
                  className="w-full h-16 text-xl font-bold bg-primary hover:bg-primary/90 rounded-[1.5rem] shadow-2xl shadow-primary/30 ios-btn" 
                  disabled={loading}
                >
                  {loading ? <Loader2 className="animate-spin mr-2" /> : 'Enviar Enlace'}
                </Button>
              </form>
            ) : (
              <div className="text-center py-6 space-y-6 animate-in zoom-in-95 duration-500">
                <div className="mx-auto w-20 h-20 bg-emerald-500/20 rounded-[2rem] flex items-center justify-center shadow-xl shadow-emerald-500/10">
                  <CheckCircle2 className="text-emerald-500 w-10 h-10" />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold font-headline">¡Enviado!</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed font-medium px-4">
                    Revisa la bandeja de entrada de <strong>{email}</strong> y sigue las instrucciones.
                  </p>
                </div>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-center border-t border-white/5 pt-8 pb-10">
            <Link href="/login" className="flex items-center gap-2 text-sm text-primary font-bold hover:text-accent transition-colors hover:underline">
              <ArrowLeft className="w-4 h-4" /> Volver al inicio
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
