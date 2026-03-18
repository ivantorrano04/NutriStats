"use client";

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronRight, Droplets, Scale, Loader2, BrainCircuit, ChefHat, Plus, Camera, CalendarDays, Trash2, Clock, Sparkles, Flame, Save, Utensils, X, Users, Activity } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserProfile, MealRecord, Intensity, Friendship } from '@/lib/types';
import { setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { AdvisorOutput } from '@/ai/flows/nutritional-advisor';
import type { SuggestMealOutput } from '@/ai/flows/meal-suggestion-flow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { NotificationCenter } from '@/components/NotificationCenter';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import getApiUrl from '@/lib/api';

export default function DashboardPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [greeting, setGreeting] = useState('Hola');
  const [advice, setAdvice] = useState<AdvisorOutput | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [mealSuggestion, setMealSuggestion] = useState<SuggestMealOutput | null>(null);
  const [loadingSuggestion, setLoadingSuggestion] = useState(false);
  const [newWeight, setNewWeight] = useState('');
  const [weightDialogOpen, setWeightDialogOpen] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [prediction, setPrediction] = useState<{weeks: number, date: string, isLoss: boolean} | null>(null);
  const [todayDate, setTodayDate] = useState<string>('');
  const [selectedMeal, setSelectedMeal] = useState<MealRecord | null>(null);
  const [friendMeals, setFriendMeals] = useState<any[]>([]);
  const [loadingSocial, setLoadingSocial] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);

  useEffect(() => {
    const now = new Date();
    const hour = now.getHours();
    if (hour < 12) setGreeting('Buenos días');
    else if (hour < 20) setGreeting('Buenas tardes');
    else setGreeting('Buenas noches');
    
    setTodayDate(now.toISOString().split('T')[0]);
  }, []);

  const userDocRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userDocRef);

  useEffect(() => {
    if (profile) {
      const today = new Date().toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      if (profile.lastLogDate === today || profile.lastLogDate === yesterday) {
        setCurrentStreak(profile.streak || 0);
      } else {
        setCurrentStreak(0);
      }
    }
  }, [profile]);

  const mealsQuery = useMemoFirebase(() => (user && todayDate) ? query(
    collection(db, 'users', user.uid, 'mealLogs'),
    where('logDateTime', '>=', todayDate),
    orderBy('logDateTime', 'desc')
  ) : null, [db, user, todayDate]);
  const { data: meals } = useCollection<MealRecord>(mealsQuery);

  const summaryDocRef = useMemoFirebase(() => (user && todayDate) ? doc(db, 'users', user.uid, 'dailySummaries', todayDate) : null, [db, user, todayDate]);
  const { data: summary } = useDoc<any>(summaryDocRef);

  useEffect(() => {
    if (!user || !db || !todayDate) return;
    const fetchSocialActivity = async () => {
      setLoadingSocial(true);
      try {
        const friendsSnap = await getDocs(query(
          collection(db, 'users', user.uid, 'friendships'),
          where('status', '==', 'accepted'),
          limit(5)
        ));
        const friendsData = friendsSnap.docs.map(d => d.data() as Friendship);
        const mealsPromises = friendsData.map(async (friend) => {
          const mSnap = await getDocs(query(
            collection(db, 'users', friend.friendId, 'mealLogs'),
            where('logDateTime', '>=', todayDate),
            orderBy('logDateTime', 'desc'),
            limit(1)
          ));
          if (!mSnap.empty) {
            return {
              ...mSnap.docs[0].data(),
              friendName: friend.friendName,
              id: mSnap.docs[0].id,
              friendId: friend.friendId
            };
          }
          return null;
        });
        const results = (await Promise.all(mealsPromises)).filter(m => m !== null);
        setFriendMeals(results);
      } catch (e) {
        console.error("Error social:", e);
      } finally {
        setLoadingSocial(false);
      }
    };
    fetchSocialActivity();
  }, [user, db, todayDate]);

  useEffect(() => {
    if (profile && profile.targetWeight && profile.objetivo !== 'mantenimiento') {
      const weightDiff = Math.abs(profile.peso - (profile.targetWeight || profile.peso));
      if (weightDiff > 0) {
        const weeklyRates: Record<Intensity, number> = { saludable: 0.4, moderado: 0.75, intenso: 1.1 };
        const rate = weeklyRates[profile.intensity] || 0.5;
        const weeksToGoal = weightDiff / rate;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + (weeksToGoal * 7));
        setPrediction({
          weeks: Math.ceil(weeksToGoal),
          date: format(targetDate, "d 'de' MMMM", { locale: es }),
          isLoss: profile.objetivo === 'perder_grasa'
        });
      }
    }
  }, [profile]);

  if (isUserLoading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-muted-foreground font-headline font-bold animate-pulse">Cargando tu progreso...</p>
      </div>
    );
  }

  const consumed = (meals || []).reduce((acc, m) => ({
    cal: acc.cal + (m.totalCalories || 0),
    prot: acc.prot + (m.totalProteins || 0),
    carb: acc.carb + (m.totalCarbohydrates || 0),
    fat: acc.fat + (m.totalFats || 0),
  }), { cal: 0, prot: 0, carb: 0, fat: 0 });

  const remaining = {
    cal: Math.max(0, (profile.calorieGoal || 2000) - consumed.cal),
    prot: Math.max(0, (profile.proteinGoalGrams || 150) - consumed.prot),
    carb: Math.max(0, (profile.carbohydrateGoalGrams || 200) - consumed.carb),
    fat: Math.max(0, (profile.fatGoalGrams || 60) - consumed.fat),
  };

  const waterConsumed = summary?.waterIntakeMl || 0;
  const calPct = Math.min((consumed.cal / (profile.calorieGoal || 2000)) * 100, 100);
  const waterPct = Math.min((waterConsumed / (profile.metaAguaMl || 2500)) * 100, 100);

  const fetchAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const res = await fetch(getApiUrl('/api/ai'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flow: 'advisor',
          input: {
            nombre: profile.name,
            objetivo: profile.objetivo,
            peso: profile.peso,
            consumo: consumed,
            metas: { cal: profile.calorieGoal, prot: profile.proteinGoalGrams, carb: profile.carbohydrateGoalGrams, fat: profile.fatGoalGrams }
          }
        }),
      });
      const data = await res.json();
      setAdvice(data);
    } catch (e) { console.error(e); } finally { setLoadingAdvice(false); }
  };

  const fetchMealSuggestion = async () => {
    setLoadingSuggestion(true);
    try {
      const res = await fetch(getApiUrl('/api/ai'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flow: 'suggest', input: { ...remaining, preferencias: "" } }),
      });
      const data = await res.json();
      setMealSuggestion(data);
    } catch (e) { console.error(e); } finally { setLoadingSuggestion(false); }
  };

  const handleSaveFavorite = () => {
    if (!user || !mealSuggestion) return;
    setSavingFavorite(true);
    addDocumentNonBlocking(collection(db, 'users', user.uid, 'favoriteRecipes'), {
      ...mealSuggestion,
      userId: user.uid,
      macros: mealSuggestion.macrosEstimados,
      createdAt: new Date().toISOString()
    }).then(() => {
      setSavingFavorite(false);
      setMealSuggestion(null);
      toast({ title: "¡Receta guardada!" });
    });
  };

  const handleAddWater = () => {
    if (!user || !todayDate) return;
    setDocumentNonBlocking(doc(db, 'users', user.uid, 'dailySummaries', todayDate), {
      userId: user.uid,
      summaryDate: todayDate,
      waterIntakeMl: waterConsumed + 250,
      updatedAt: new Date().toISOString()
    }, { merge: true });
  };

  const handleLogWeight = () => {
    if (!user || !newWeight || !todayDate) return;
    const weightVal = parseFloat(newWeight);
    setDocumentNonBlocking(doc(db, 'users', user.uid), { peso: weightVal }, { merge: true });
    addDocumentNonBlocking(collection(db, 'users', user.uid, 'weightLogs'), {
      userId: user.uid,
      logDate: todayDate,
      weightKg: weightVal,
      createdAt: new Date().toISOString()
    });
    setWeightDialogOpen(false);
    toast({ title: "Peso actualizado" });
  };

  return (
    <div className="min-h-screen safe-area-pt safe-area-pb pb-32">
      <main className="max-w-xl mx-auto px-5 pt-8 space-y-8">
        {/* Header Elegante */}
        <header className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-primary font-bold text-xs uppercase tracking-[0.2em]">{greeting}, {profile.name.split(' ')[0]}</span>
              {currentStreak > 0 && (
                <div className="flex items-center gap-1 bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <Flame className="w-3 h-3 fill-orange-500" /> {currentStreak}
                </div>
              )}
            </div>
            <h1 className="text-4xl font-headline font-bold text-foreground tracking-tight">Tu Progreso</h1>
          </div>
          <div className="flex gap-2.5">
            <NotificationCenter />
            <Button size="icon" variant="secondary" className="glass rounded-2xl ios-btn" onClick={fetchAdvice}>
              <BrainCircuit className={cn("w-5 h-5 text-accent", loadingAdvice && "animate-spin")} />
            </Button>
            <Button size="icon" variant="secondary" className="glass rounded-2xl ios-btn" onClick={fetchMealSuggestion}>
              <ChefHat className={cn("w-5 h-5 text-primary", loadingSuggestion && "animate-spin")} />
            </Button>
          </div>
        </header>

        {/* Botón Principal de Acción */}
        <Link href="/registrar" className="block">
          <Button className="w-full h-20 rounded-[2.5rem] bg-primary hover:bg-primary/90 text-white font-bold text-xl shadow-xl shadow-primary/25 flex items-center justify-center gap-4 ios-btn transition-all group">
            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center group-hover:scale-105 transition-transform backdrop-blur-md">
              <Camera className="w-7 h-7" />
            </div>
            Escanear Comida
            <Plus className="w-6 h-6 ml-auto opacity-40" />
          </Button>
        </Link>

        {/* Tarjeta de Calorías Premium */}
        <Card className="glass rounded-[3rem] overflow-hidden border-white/20 shadow-2xl relative">
          <div className="absolute top-8 right-8">
            <div className="w-16 h-16 rounded-full border-4 border-secondary/30 flex items-center justify-center relative">
               <div className="absolute inset-0 rounded-full border-4 border-primary transition-all duration-1000" style={{ clipPath: `inset(${100-calPct}% 0 0 0)` }} />
               <span className="text-sm font-bold">{calPct.toFixed(0)}%</span>
            </div>
          </div>
          <CardContent className="p-8 space-y-8">
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Kcal Hoy</p>
              <div className="flex items-baseline gap-2">
                <span className="text-6xl font-headline font-bold text-foreground tracking-tighter">{consumed.cal}</span>
                <span className="text-lg text-muted-foreground font-medium opacity-50">/ {profile.calorieGoal}</span>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-5 pt-4 border-t border-white/5">
              <MacroBar label="Proteínas" value={consumed.prot} target={profile.proteinGoalGrams} color="bg-primary" />
              <MacroBar label="Carbohidratos" value={consumed.carb} target={profile.carbohydrateGoalGrams} color="bg-accent" />
              <MacroBar label="Grasas" value={consumed.fat} target={profile.fatGoalGrams} color="bg-orange-500" />
            </div>
          </CardContent>
        </Card>

        {/* Orbes de Agua y Peso */}
        <div className="grid grid-cols-2 gap-5">
          <Card className="glass rounded-[2.5rem] p-6 space-y-4 border-white/10 shadow-lg group ios-btn" onClick={handleAddWater}>
            <div className="flex justify-between items-center">
              <Droplets className="w-6 h-6 text-blue-400" />
              <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">{waterPct.toFixed(0)}%</span>
            </div>
            <div>
              <p className="text-2xl font-headline font-bold">{waterConsumed} <span className="text-[10px] opacity-50 uppercase">ml</span></p>
              <Progress value={waterPct} className="h-1.5 mt-2 bg-blue-500/10" />
            </div>
          </Card>

          <Dialog open={weightDialogOpen} onOpenChange={setWeightDialogOpen}>
            <DialogTrigger asChild>
              <Card className="glass rounded-[2.5rem] p-6 space-y-4 border-white/10 shadow-lg group ios-btn">
                <div className="flex justify-between items-center">
                  <Scale className="w-6 h-6 text-orange-400" />
                  <Plus className="w-4 h-4 text-muted-foreground opacity-40" />
                </div>
                <div>
                  <p className="text-2xl font-headline font-bold">{profile.peso} <span className="text-[10px] opacity-50 uppercase">kg</span></p>
                  <p className="text-[9px] text-muted-foreground mt-2 uppercase font-bold tracking-widest">Objetivo: {profile.targetWeight}kg</p>
                </div>
              </Card>
            </DialogTrigger>
            <DialogContent className="glass border-none rounded-[2.5rem] max-w-xs">
              <DialogHeader><DialogTitle className="text-center font-bold">Nuevo Peso</DialogTitle></DialogHeader>
              <div className="space-y-6 pt-4">
                <Input type="number" placeholder="Ej. 75.5" className="glass h-14 rounded-2xl text-center text-2xl font-bold" value={newWeight} onChange={e => setNewWeight(e.target.value)} />
                <Button className="w-full bg-primary h-14 font-bold rounded-2xl ios-btn" onClick={handleLogWeight}>Actualizar</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pulso Social Integrado */}
        {friendMeals.length > 0 && (
          <section className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-primary" /> Pulso de la Comunidad
            </h3>
            <div className="space-y-3">
              {friendMeals.map((m) => (
                <Link key={m.id} href="/amigos" className="glass p-3 rounded-3xl flex items-center gap-4 ios-btn hover:bg-white/5 transition-colors border-white/5">
                  <div className="w-12 h-12 rounded-2xl bg-secondary/50 overflow-hidden shrink-0 border border-white/5">
                    {m.photoDataUri ? <img src={m.photoDataUri} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center font-bold">{m.friendName[0]}</div>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{m.friendName}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{m.mealType}</p>
                  </div>
                  <div className="bg-orange-500/10 px-3 py-1 rounded-full flex items-center gap-1.5">
                    <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                    <span className="text-[10px] font-bold text-orange-500">{m.totalCalories}</span>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Diario de Comidas con Mejor Jerarquía */}
        <section className="space-y-4 pb-12">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">Registros de Hoy</h3>
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{meals?.length || 0} platos</span>
          </div>
          <div className="space-y-4">
            {meals?.length === 0 ? (
              <div className="py-16 text-center glass rounded-[3rem] border-dashed border-white/20 opacity-40">
                <Utensils className="w-10 h-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">No has comido nada hoy...</p>
              </div>
            ) : (
              meals?.map(meal => (
                <div key={meal.id} className="glass p-4 rounded-[2rem] flex items-center gap-4 ios-btn hover:bg-white/5 transition-all border-white/5" onClick={() => setSelectedMeal(meal)}>
                  <div className="w-20 h-20 rounded-[1.5rem] bg-secondary/30 overflow-hidden shrink-0 relative border border-white/5">
                    {meal.photoDataUri ? <img src={meal.photoDataUri} className="w-full h-full object-cover" alt="" /> : <Utensils className="w-8 h-8 m-auto absolute inset-0 opacity-20" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground truncate text-lg">{meal.mealType}</h4>
                    <div className="flex gap-3 mt-1.5">
                      <span className="text-[10px] font-bold text-primary">{meal.totalCalories} kcal</span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase opacity-50 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(meal.logDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground opacity-30" />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Modales de IA con UI Mejorada */}
        <Dialog open={loadingSuggestion || loadingAdvice}>
          <DialogContent className="glass border-none max-w-[280px] p-10 rounded-[3rem] flex flex-col items-center justify-center text-center outline-none">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
            </div>
            <h3 className="text-xl font-headline font-bold">Consultando IA</h3>
            <p className="text-xs text-muted-foreground mt-2 font-medium">Sincronizando con tus biometría...</p>
          </DialogContent>
        </Dialog>

        {/* Modal de Detalle de Comida */}
        {selectedMeal && (
          <Dialog open={!!selectedMeal} onOpenChange={() => setSelectedMeal(null)}>
            <DialogContent className="glass border-none p-0 overflow-hidden sm:max-w-md rounded-[3rem] shadow-2xl">
              <div className="relative aspect-video w-full bg-secondary/50">
                {selectedMeal.photoDataUri ? <img src={selectedMeal.photoDataUri} className="w-full h-full object-cover" alt="" /> : <Utensils className="w-12 h-12 absolute inset-0 m-auto opacity-10" />}
                <DialogClose className="absolute top-6 right-6 h-10 w-10 glass rounded-full flex items-center justify-center ios-btn">
                  <X className="w-5 h-5" />
                </DialogClose>
              </div>
              <div className="p-8 space-y-8">
                <div>
                  <h2 className="text-3xl font-headline font-bold">{selectedMeal.mealType}</h2>
                  <p className="text-xs text-muted-foreground mt-1 font-medium">{new Date(selectedMeal.logDateTime).toLocaleString()}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <NutrientStat label="Calorías" value={selectedMeal.totalCalories} unit="kcal" color="text-primary" />
                  <NutrientStat label="Proteínas" value={selectedMeal.totalProteins} unit="g" color="text-accent" />
                  <NutrientStat label="Carbos" value={selectedMeal.totalCarbohydrates} unit="g" color="text-orange-500" />
                  <NutrientStat label="Grasas" value={selectedMeal.totalFats} unit="g" color="text-emerald-500" />
                </div>
                <Button variant="ghost" className="w-full text-destructive hover:bg-destructive/10 rounded-2xl h-14 font-bold ios-btn" onClick={() => { deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'mealLogs', selectedMeal.id)); setSelectedMeal(null); }}>
                  <Trash2 className="w-4 h-4 mr-2" /> Eliminar Registro
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}

function MacroBar({ label, value, target, color }: any) {
  const pct = Math.min((value / target) * 100, 100);
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        <span>{label}</span>
        <span className="text-foreground">{value}g <span className="opacity-40">/ {target}g</span></span>
      </div>
      <div className="h-3 w-full bg-secondary/20 rounded-full overflow-hidden border border-white/5">
        <div className={cn("h-full transition-all duration-1000", color)} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function NutrientStat({ label, value, unit, color }: any) {
  return (
    <div className="bg-white/5 p-5 rounded-[1.8rem] border border-white/5 text-center">
      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-1">{label}</p>
      <p className={cn("text-2xl font-bold tracking-tighter", color)}>{value}<span className="text-[10px] font-medium opacity-50 ml-0.5">{unit}</span></p>
    </div>
  );
}