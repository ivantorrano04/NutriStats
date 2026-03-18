
"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore } from '@/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ActivityLevel, Goal, Gender, UserProfile, Intensity } from '@/lib/types';
import { Loader2, Sparkles, ChevronRight, Target, Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIVITY_DESC: Record<ActivityLevel, string> = {
  sedentario: 'Poco o nada (0 días)',
  ligero: 'Ligero (1-2 días)',
  moderado: 'Moderado (3-5 días)',
  activo: 'Activo (6-7 días)',
  muy_activo: 'Deportista / Trabajo físico'
};

const GOAL_LABELS: Record<Goal, string> = {
  perder_grasa: 'Perder Grasa',
  mantenimiento: 'Mantener Peso',
  ganar_musculo: 'Ganar Masa'
};

export default function OnboardingPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({
    peso: 70,
    targetWeight: 65,
    altura: 170,
    edad: 25,
    genero: 'hombre',
    actividad: 'moderado',
    objetivo: 'perder_grasa',
    intensity: 'moderado'
  });

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  const calculateTargets = (u: any) => {
    let bmr = 10 * u.peso + 6.25 * u.altura - 5 * u.edad;
    bmr = u.genero === 'hombre' ? bmr + 5 : bmr - 161;
    
    const factors: Record<ActivityLevel, number> = {
      sedentario: 1.2, ligero: 1.375, moderado: 1.55, activo: 1.725, muy_activo: 1.9
    };
    let tdee = bmr * factors[u.actividad as ActivityLevel];
    
    const intensityAdjustment: Record<Intensity, number> = {
      saludable: 300,
      moderado: 600,
      intenso: 900
    };

    const diff = intensityAdjustment[u.intensity as Intensity] || 500;

    if (u.objetivo === 'perder_grasa') tdee -= diff;
    if (u.objetivo === 'ganar_musculo') tdee += diff;
    
    const cal = Math.round(tdee);
    return {
      cal,
      prot: Math.round(u.peso * 2),
      fat: Math.round((cal * 0.25) / 9),
      carb: Math.round((cal - (u.peso * 2 * 4) - ((cal * 0.25))) / 4),
      water: Math.round(u.peso * 35)
    };
  };

  const handleStart = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const targets = calculateTargets(formData);
      
      const profile: UserProfile = {
        ...formData,
        id: user.uid,
        name: user.displayName || 'Usuario',
        email: user.email || '',
        calorieGoal: targets.cal,
        proteinGoalGrams: targets.prot,
        carbohydrateGoalGrams: targets.carb,
        fatGoalGrams: targets.fat,
        metaAguaMl: targets.water,
        streak: 0,
        lastLogDate: '',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), profile);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>;

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-5 relative overflow-x-hidden pb-10">
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/15 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-accent/15 blur-[100px] rounded-full" />

      <div className="w-full max-w-[360px] relative z-10 space-y-5">
        <header className="text-center space-y-1">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-primary flex items-center justify-center shadow-xl shadow-primary/10">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-headline font-bold tracking-tight text-foreground pt-2">Tu Plan IA</h1>
          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em] opacity-60">Diseño de Biometría</p>
        </header>

        <Card className="glass border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardContent className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">Peso (kg)</Label>
                <Input 
                  type="number" 
                  className="glass h-11 rounded-xl border-white/5 text-base font-bold" 
                  value={formData.peso ?? ''} 
                  onChange={e => setFormData({...formData, peso: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">Altura (cm)</Label>
                <Input 
                  type="number" 
                  className="glass h-11 rounded-xl border-white/5 text-base font-bold" 
                  value={formData.altura ?? ''} 
                  onChange={e => setFormData({...formData, altura: Number(e.target.value)})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">Edad</Label>
                <Input 
                  type="number" 
                  className="glass h-11 rounded-xl border-white/5 text-base font-bold" 
                  value={formData.edad ?? ''} 
                  onChange={e => setFormData({...formData, edad: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">Género</Label>
                <RadioGroup value={formData.genero} onValueChange={v => setFormData({...formData, genero: v as Gender})} className="flex gap-2">
                  <div className={cn(
                    "flex-1 flex items-center justify-center h-11 glass rounded-xl cursor-pointer text-xs font-bold transition-all border-white/5",
                    formData.genero === 'hombre' ? "bg-primary/20 border-primary/40 shadow-lg" : "opacity-50"
                  )} onClick={() => setFormData({...formData, genero: 'hombre'})}>
                    H
                  </div>
                  <div className={cn(
                    "flex-1 flex items-center justify-center h-11 glass rounded-xl cursor-pointer text-xs font-bold transition-all border-white/5",
                    formData.genero === 'mujer' ? "bg-primary/20 border-primary/40 shadow-lg" : "opacity-50"
                  )} onClick={() => setFormData({...formData, genero: 'mujer'})}>
                    M
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">Actividad</Label>
              <Select value={formData.actividad} onValueChange={v => setFormData({...formData, actividad: v as ActivityLevel})}>
                <SelectTrigger className="glass h-11 rounded-xl border-white/5 text-[11px] font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-white/5 rounded-2xl">
                  {Object.entries(ACTIVITY_DESC).map(([key, desc]) => (
                    <SelectItem key={key} value={key} className="text-xs">
                      {desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground px-1">Objetivo</Label>
              <Select value={formData.objetivo} onValueChange={v => setFormData({...formData, objetivo: v as Goal})}>
                <SelectTrigger className="glass h-11 rounded-xl border-white/5 text-[11px] font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-white/5 rounded-2xl">
                  {Object.entries(GOAL_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key} className="text-xs font-bold">{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              className="w-full h-14 text-base font-bold bg-primary hover:bg-primary/90 mt-4 rounded-[1.5rem] shadow-xl shadow-primary/20 ios-btn" 
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Empezar Plan"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
