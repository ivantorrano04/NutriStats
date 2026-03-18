
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
import { Loader2, Sparkles, ChevronRight, Target, Activity, Ruler } from 'lucide-react';
import { cn } from '@/lib/utils';

const ACTIVITY_DESC: Record<ActivityLevel, string> = {
  sedentario: 'Poco o nada (0 días)',
  ligero: 'Ejercicio ligero (1-2 días/semana)',
  moderado: 'Ejercicio moderado (3-5 días/semana)',
  activo: 'Entrenamiento diario (6-7 días/semana)',
  muy_activo: 'Entrenamiento intenso o trabajo físico'
};

const GOAL_LABELS: Record<Goal, string> = {
  perder_grasa: 'Perder Grasa',
  mantenimiento: 'Mantener Peso',
  ganar_musculo: 'Ganar Masa Muscular'
};

const INTENSITY_LABELS: Record<Intensity, string> = {
  saludable: 'Plan Saludable (Sostenible)',
  moderado: 'Plan Moderado (Equilibrado)',
  intenso: 'Plan Intenso (Resultados Rápidos)'
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
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', user.uid), profile);
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (isUserLoading) return <div className="h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-12 h-12" /></div>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-primary/15 blur-[150px] rounded-full animate-pulse" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-accent/15 blur-[150px] rounded-full animate-pulse" style={{ animationDelay: '3s' }} />

      <div className="w-full max-w-lg relative z-10 space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
        <header className="text-center space-y-3">
          <div className="mx-auto w-16 h-16 rounded-[1.5rem] bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 animate-float">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <h1 className="text-4xl font-headline font-bold tracking-tighter text-foreground pt-2">Tu Plan IA</h1>
          <p className="text-muted-foreground font-medium max-w-[280px] mx-auto leading-tight">Configura tu perfil para que la IA diseñe tus macros</p>
        </header>

        <Card className="glass border-none shadow-[0_50px_100px_rgba(0,0,0,0.4)] rounded-[3rem] overflow-hidden">
          <CardHeader className="pb-0 pt-10 px-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-primary/20 flex items-center justify-center">
                 <Target className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-2xl font-headline font-bold">Biometría</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Peso Actual (kg)</Label>
                <Input 
                  type="number" 
                  className="glass h-14 rounded-2xl border-white/5 text-lg font-bold" 
                  value={formData.peso ?? ''} 
                  onChange={e => setFormData({...formData, peso: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Peso Objetivo (kg)</Label>
                <Input 
                  type="number" 
                  className="glass h-14 rounded-2xl border-white/5 text-lg font-bold" 
                  value={formData.targetWeight ?? ''} 
                  onChange={e => setFormData({...formData, targetWeight: Number(e.target.value)})} 
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Altura (cm)</Label>
                <Input 
                  type="number" 
                  className="glass h-14 rounded-2xl border-white/5 text-lg font-bold" 
                  value={formData.altura ?? ''} 
                  onChange={e => setFormData({...formData, altura: Number(e.target.value)})} 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Edad</Label>
                <Input 
                  type="number" 
                  className="glass h-14 rounded-2xl border-white/5 text-lg font-bold" 
                  value={formData.edad ?? ''} 
                  onChange={e => setFormData({...formData, edad: Number(e.target.value)})} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1 flex items-center gap-2">
                <Activity className="w-3 h-3" /> Nivel de Actividad
              </Label>
              <Select value={formData.actividad} onValueChange={v => setFormData({...formData, actividad: v as ActivityLevel})}>
                <SelectTrigger className="glass h-14 rounded-2xl border-white/5 text-sm font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-white/5 rounded-2xl">
                  {Object.entries(ACTIVITY_DESC).map(([key, desc]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex flex-col text-left py-1">
                        <span className="capitalize font-bold text-sm">{key.replace('_', ' ')}</span>
                        <span className="text-[10px] text-muted-foreground">{desc}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Tu Objetivo Principal</Label>
                <Select value={formData.objetivo} onValueChange={v => setFormData({...formData, objetivo: v as Goal})}>
                  <SelectTrigger className="glass h-14 rounded-2xl border-white/5 text-sm font-medium">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass border-white/5 rounded-2xl">
                    {Object.entries(GOAL_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key} className="font-bold">{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground px-1">Género</Label>
              <RadioGroup value={formData.genero} onValueChange={v => setFormData({...formData, genero: v as Gender})} className="flex gap-4">
                <div className={cn(
                  "flex-1 flex items-center justify-center gap-2 glass px-6 py-4 rounded-2xl cursor-pointer transition-all border-white/5",
                  formData.genero === 'hombre' ? "bg-primary/20 border-primary/40 shadow-lg shadow-primary/10" : "hover:bg-white/5"
                )} onClick={() => setFormData({...formData, genero: 'hombre'})}>
                  <RadioGroupItem value="hombre" id="h" className="sr-only" />
                  <span className="font-bold tracking-tight">Hombre</span>
                </div>
                <div className={cn(
                  "flex-1 flex items-center justify-center gap-2 glass px-6 py-4 rounded-2xl cursor-pointer transition-all border-white/5",
                  formData.genero === 'mujer' ? "bg-primary/20 border-primary/40 shadow-lg shadow-primary/10" : "hover:bg-white/5"
                )} onClick={() => setFormData({...formData, genero: 'mujer'})}>
                  <RadioGroupItem value="mujer" id="m" className="sr-only" />
                  <span className="font-bold tracking-tight">Mujer</span>
                </div>
              </RadioGroup>
            </div>

            <Button 
              className="w-full h-18 py-8 text-xl font-bold bg-primary hover:bg-primary/90 mt-4 rounded-[2rem] shadow-2xl shadow-primary/30 group ios-btn transition-all" 
              onClick={handleStart}
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="animate-spin mr-2" />
              ) : (
                <>
                  <span>Crear mi Plan</span>
                  <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
