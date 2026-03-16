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
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full" />
      <Card className="glass w-full max-w-md border-none shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold">NutriScan</CardTitle>
          <CardDescription>Recupera tu acceso</CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {!sent ? (
            <form onSubmit={handleReset} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Email de tu cuenta</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="email" 
                    placeholder="tu@email.com" 
                    className="glass pl-10 h-12" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button 
                type="submit"
                className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 mt-4 rounded-2xl shadow-xl shadow-primary/20" 
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin mr-2" /> : 'Enviar enlace'}
              </Button>
            </form>
          ) : (
            <div className="text-center py-6 space-y-4">
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mb-2">
                <CheckCircle2 className="text-emerald-500 w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold">¡Email Enviado!</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Por favor, revisa tu bandeja de entrada (y la carpeta de spam).
                </p>
              </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex justify-center border-t border-border/50 pt-6">
          <Link href="/login" className="flex items-center gap-2 text-sm text-primary font-bold hover:underline">
            <ArrowLeft className="w-4 h-4" /> Volver al inicio de sesión
          </Link>
        </CardFooter>
      </Card>
    </div>
  );
}
