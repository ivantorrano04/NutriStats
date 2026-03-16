
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
import { Loader2, Sparkles } from 'lucide-react';

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
    
    // Ajuste por intensidad
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

  if (isUserLoading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6 transition-colors duration-500">
      <div className="absolute inset-0 bg-primary/5 blur-[120px] rounded-full" />
      <Card className="glass w-full max-w-md border-none shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-accent" />
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary rounded-2xl flex items-center justify-center mb-2 shadow-lg shadow-primary/20">
            <Sparkles className="text-white w-6 h-6" />
          </div>
          <CardTitle className="text-3xl font-headline font-bold">Configuración</CardTitle>
          <CardDescription>Casi listo, {user?.displayName || 'Usuario'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Peso Actual (kg)</Label>
              <Input 
                type="number" 
                className="glass h-12" 
                value={formData.peso ?? ''} 
                onChange={e => setFormData({...formData, peso: Number(e.target.value)})} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Peso Objetivo (kg)</Label>
              <Input 
                type="number" 
                className="glass h-12" 
                value={formData.targetWeight ?? ''} 
                onChange={e => setFormData({...formData, targetWeight: Number(e.target.value)})} 
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Altura (cm)</Label>
              <Input 
                type="number" 
                className="glass h-12" 
                value={formData.altura ?? ''} 
                onChange={e => setFormData({...formData, altura: Number(e.target.value)})} 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Edad</Label>
              <Input 
                type="number" 
                className="glass h-12" 
                value={formData.edad ?? ''} 
                onChange={e => setFormData({...formData, edad: Number(e.target.value)})} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nivel de Actividad</Label>
            <Select value={formData.actividad} onValueChange={v => setFormData({...formData, actividad: v as ActivityLevel})}>
              <SelectTrigger className="glass h-12">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="glass border-none">
                {Object.entries(ACTIVITY_DESC).map(([key, desc]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex flex-col text-left">
                      <span className="capitalize font-bold">{key.replace('_', ' ')}</span>
                      <span className="text-[10px] text-muted-foreground">{desc}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tu Objetivo</Label>
              <Select value={formData.objetivo} onValueChange={v => setFormData({...formData, objetivo: v as Goal})}>
                <SelectTrigger className="glass h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-none">
                  {Object.entries(GOAL_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Agresividad de la Dieta</Label>
              <Select value={formData.intensity} onValueChange={v => setFormData({...formData, intensity: v as Intensity})}>
                <SelectTrigger className="glass h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="glass border-none">
                  {Object.entries(INTENSITY_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Género</Label>
            <RadioGroup value={formData.genero} onValueChange={v => setFormData({...formData, genero: v as Gender})} className="flex gap-4">
              <div className="flex items-center space-x-2 glass px-4 py-2 rounded-xl cursor-pointer">
                <RadioGroupItem value="hombre" id="h" />
                <Label htmlFor="h">Hombre</Label>
              </div>
              <div className="flex items-center space-x-2 glass px-4 py-2 rounded-xl cursor-pointer">
                <RadioGroupItem value="mujer" id="m" />
                <Label htmlFor="m">Mujer</Label>
              </div>
            </RadioGroup>
          </div>

          <Button 
            className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 mt-4 rounded-2xl shadow-xl shadow-primary/20" 
            onClick={handleStart}
            disabled={loading}
          >
            {loading ? <Loader2 className="animate-spin mr-2" /> : 'Calcular mi Plan'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
