
"use client";

import { useState, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase, useAuth } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, LogOut, Save, Loader2, Moon, Sun, User as UserIcon } from 'lucide-react';
import { ActivityLevel, Goal, UserProfile, Intensity } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

const ACTIVITY_DESC: Record<ActivityLevel, string> = {
  sedentario: 'Poco o ningún ejercicio',
  ligero: 'Ejercicio ligero (1-2 días/semana)',
  moderado: 'Ejercicio moderado (3-5 días/semana)',
  activo: 'Entrenamiento intenso (6-7 días/semana)',
  muy_activo: 'Atleta o trabajo físico pesado'
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

export default function PerfilPage() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [formData, setFormData] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  const userDocRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    if (profile && !formData) {
      setFormData(profile);
    }
    // Sincronizar estado inicial del tema
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
  }, [profile, formData]);

  const toggleTheme = (newTheme: 'light' | 'dark') => {
    setTheme(newTheme);
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('nutriscan_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('nutriscan_theme', 'light');
    }
  };

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

  const handleSave = async () => {
    if (!user || !formData) return;
    setIsSaving(true);
    try {
      const targets = calculateTargets(formData);
      const updatedData = {
        ...formData,
        calorieGoal: targets.cal,
        proteinGoalGrams: targets.prot,
        carbohydrateGoalGrams: targets.carb,
        fatGoalGrams: targets.fat,
        metaAguaMl: targets.water,
        updatedAt: new Date().toISOString()
      };

      await updateDoc(doc(db, 'users', user.uid), updatedData);
      setFormData(updatedData);
      
      toast({
        title: "Plan Actualizado",
        description: `Meta recalculada: ${targets.cal} kcal (${INTENSITY_LABELS[formData.intensity as Intensity]}).`
      });
    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: "Error", description: "No se pudieron guardar los cambios." });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login');
    } catch (e) { console.error(e); }
  };

  if (isUserLoading || !formData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-accent" />
        <p className="text-muted-foreground animate-pulse font-headline">Sincronizando perfil...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-48">
      <main className="max-w-2xl mx-auto px-6 pt-10 space-y-8">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center text-2xl font-bold shadow-lg shadow-primary/20 text-white">
              {formData.name?.charAt(0) || <UserIcon />}
            </div>
            <div>
              <h1 className="text-3xl font-headline font-bold text-foreground">{formData.name}</h1>
              <p className="text-muted-foreground font-medium">Gestión de Perfil</p>
            </div>
          </div>
          <div className="flex glass p-1 rounded-2xl">
            <Button 
              size="icon" 
              variant={theme === 'light' ? 'secondary' : 'ghost'} 
              className="rounded-xl h-10 w-10 ios-btn" 
              onClick={() => toggleTheme('light')}
            >
              <Sun className={theme === 'light' ? 'text-primary' : 'text-muted-foreground'} />
            </Button>
            <Button 
              size="icon" 
              variant={theme === 'dark' ? 'secondary' : 'ghost'} 
              className="rounded-xl h-10 w-10 ios-btn" 
              onClick={() => toggleTheme('dark')}
            >
              <Moon className={theme === 'dark' ? 'text-primary' : 'text-muted-foreground'} />
            </Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6">
          <Card className="glass border-none shadow-xl">
            <CardHeader><CardTitle className="text-lg font-headline flex items-center gap-2 text-foreground"><UserIcon className="w-5 h-5 text-accent" /> Datos Personales</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nombre completo</Label>
                <Input type="text" value={formData.name || ''} className="glass text-foreground" onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                   <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Peso Actual (kg)</Label>
                   <Input type="number" value={formData.peso ?? ''} className="glass text-foreground" onChange={e => setFormData({...formData, peso: Number(e.target.value)})} />
                 </div>
                 <div className="space-y-2">
                   <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Peso Objetivo (kg)</Label>
                   <Input type="number" value={formData.targetWeight ?? ''} className="glass text-foreground" onChange={e => setFormData({...formData, targetWeight: Number(e.target.value)})} />
                 </div>
              </div>
            </CardContent>
          </Card>

          <Card className="glass border-none shadow-xl">
            <CardHeader><CardTitle className="text-lg font-headline flex items-center gap-2 text-foreground"><Target className="w-5 h-5 text-accent" /> Plan Estratégico</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Nivel de Actividad</Label>
                <Select value={formData.actividad} onValueChange={v => setFormData({...formData, actividad: v as ActivityLevel})}>
                  <SelectTrigger className="glass text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="glass">
                    {Object.entries(ACTIVITY_DESC).map(([key, desc]) => (
                      <SelectItem key={key} value={key}><div className="flex flex-col text-left"><span className="capitalize font-bold">{key.replace('_', ' ')}</span><span className="text-[10px] text-muted-foreground">{desc}</span></div></SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Objetivo Principal</Label>
                  <Select value={formData.objetivo} onValueChange={v => setFormData({...formData, objetivo: v as Goal})}>
                    <SelectTrigger className="glass text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent className="glass">
                      {Object.entries(GOAL_LABELS).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Agresividad</Label>
                  <Select value={formData.intensity} onValueChange={v => setFormData({...formData, intensity: v as Intensity})}>
                    <SelectTrigger className="glass text-foreground"><SelectValue /></SelectTrigger>
                    <SelectContent className="glass">
                      {Object.entries(INTENSITY_LABELS).map(([key, label]) => (<SelectItem key={key} value={key}>{label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-4 pb-10">
            <Button variant="outline" className="flex-1 border-destructive text-destructive hover:bg-destructive/10 rounded-2xl glass ios-btn" onClick={handleLogout} disabled={isSaving}>
              <LogOut className="w-4 h-4 mr-2" /> Salir
            </Button>
            <Button className="flex-1 bg-primary hover:bg-primary/90 text-white font-bold rounded-2xl shadow-lg shadow-primary/20 ios-btn" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />} 
              Guardar
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
