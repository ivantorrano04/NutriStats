
"use client";

import { useEffect, useState } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { ChevronRight, Droplets, Scale, Loader2, BrainCircuit, ChefHat, Plus, Camera, CalendarDays, Trash2, Clock, Sparkles, Flame, Save, Utensils, X, Users } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { UserProfile, MealRecord, Intensity, Friendship } from '@/lib/types';
import { setDocumentNonBlocking, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import type { AdvisorOutput } from '@/ai/flows/nutritional-advisor';
import type { SuggestMealOutput } from '@/ai/flows/meal-suggestion-flow';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { NotificationCenter } from '@/components/NotificationCenter';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

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
      
      // La racha se mantiene si se registró hoy o ayer
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
          limit(10)
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
        console.error("Error loading social feed:", e);
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
        const weeklyRates: Record<Intensity, number> = {
          saludable: 0.4,
          moderado: 0.75,
          intenso: 1.1
        };
        const rate = weeklyRates[profile.intensity] || 0.5;
        const weeksToGoal = weightDiff / rate;
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() + (weeksToGoal * 7));
        setPrediction({
          weeks: Math.ceil(weeksToGoal),
          date: format(targetDate, "d 'de' MMMM", { locale: es }),
          isLoss: profile.objetivo === 'perder_grasa'
        });
      } else {
        setPrediction(null);
      }
    } else {
      setPrediction(null);
    }
  }, [profile]);

  if (isUserLoading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <div className="relative">
          <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full" />
          <Loader2 className="w-12 h-12 animate-spin text-primary relative z-10" />
        </div>
        <p className="text-muted-foreground font-headline animate-pulse text-lg font-bold tracking-tight">Sincronizando...</p>
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
      const payload = {
        flow: 'advisor',
        input: {
          nombre: profile.name || 'Usuario',
          objetivo: profile.objetivo || 'perder_grasa',
          peso: profile.peso || 70,
          consumo: { cal: consumed.cal, prot: consumed.prot, carb: consumed.carb, fat: consumed.fat },
          metas: { cal: profile.calorieGoal || 2000, prot: profile.proteinGoalGrams || 150, carb: profile.carbohydrateGoalGrams || 200, fat: profile.fatGoalGrams || 60 }
        }
      };

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('AI service error');

      const data: AdvisorOutput = await res.json();
      setAdvice(data);
    } catch (e) { console.error(e); } finally { setLoadingAdvice(false); }
  };

  const fetchMealSuggestion = async () => {
    setLoadingSuggestion(true);
    try {
      const payload = {
        flow: 'suggest',
        input: {
          remainingCal: remaining.cal,
          remainingProt: remaining.prot,
          remainingCarb: remaining.carb,
          remainingFat: remaining.fat
        }
      };

      const res = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('AI service error');

      const data: SuggestMealOutput = await res.json();
      setMealSuggestion(data);
    } catch (e) { console.error(e); } finally { setLoadingSuggestion(false); }
  };

  const handleSaveFavorite = () => {
    if (!user || !mealSuggestion) return;
    setSavingFavorite(true);
    addDocumentNonBlocking(collection(db, 'users', user.uid, 'favoriteRecipes'), {
      userId: user.uid,
      nombrePlato: mealSuggestion.nombrePlato,
      descripcion: mealSuggestion.descripcion,
      ingredientes: mealSuggestion.ingredientes,
      instrucciones: mealSuggestion.instrucciones,
      macros: mealSuggestion.macrosEstimados,
      createdAt: new Date().toISOString()
    }).then(() => {
      setSavingFavorite(false);
      setMealSuggestion(null);
      toast({ title: "¡Receta guardada!", description: "La encontrarás en Favoritos." });
    });
  };

  const handleAddWater = () => {
    if (!user || !todayDate) return;
    const newWater = waterConsumed + 250;
    setDocumentNonBlocking(doc(db, 'users', user.uid, 'dailySummaries', todayDate), {
      userId: user.uid,
      summaryDate: todayDate,
      waterIntakeMl: newWater,
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

  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;
    deleteDocumentNonBlocking(doc(db, 'users', user.uid, 'mealLogs', mealId));
    setSelectedMeal(null);
    toast({ title: "Registro eliminado" });
  };

  return (
    <div className="min-h-screen bg-transparent pb-48">
      <main className="max-w-2xl mx-auto px-6 pt-10 space-y-8">
        <header className="flex justify-between items-start">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-primary font-bold text-sm tracking-wider uppercase opacity-80">
                {greeting}, {profile.name}
              </p>
              {currentStreak > 0 && (
                <div className="flex items-center gap-1 bg-orange-500/10 text-orange-500 px-2 py-0.5 rounded-full text-[10px] font-bold animate-pulse">
                  <Flame className="w-3 h-3 fill-orange-500" /> Racha: {currentStreak}
                </div>
              )}
            </div>
            <h1 className="text-4xl font-headline font-bold text-foreground drop-shadow-sm">NutriScan</h1>
          </div>
          <div className="flex gap-2">
            <NotificationCenter />
            <Button size="icon" variant="secondary" className="rounded-2xl glass ios-btn" onClick={fetchAdvice}>
              <BrainCircuit className={cn("w-5 h-5 text-accent", loadingAdvice && "animate-spin")} />
            </Button>
            <Button size="icon" variant="secondary" className="rounded-2xl glass ios-btn" onClick={fetchMealSuggestion}>
              <ChefHat className={cn("w-5 h-5 text-primary", loadingSuggestion && "animate-spin")} />
            </Button>
          </div>
        </header>

        <Link href="/registrar" className="block animate-float">
          <Button className="w-full h-24 rounded-[3rem] bg-primary hover:bg-primary/90 text-white font-bold text-2xl shadow-2xl shadow-primary/30 flex items-center justify-center gap-4 group ios-btn">
            <div className="w-14 h-14 bg-white/20 rounded-[1.5rem] flex items-center justify-center group-hover:scale-110 transition-transform backdrop-blur-md">
              <Camera className="w-8 h-8" />
            </div>
            Escanear Comida
            <Plus className="w-8 h-8 ml-auto opacity-50" />
          </Button>
        </Link>

        {friendMeals.length > 0 && (
          <section className="space-y-4">
             <div className="flex justify-between items-center px-2">
               <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                 <Users className="w-3 h-3 text-primary" /> Pulso de la Comunidad
               </h3>
               <Link href="/amigos" className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider">Ver todos</Link>
            </div>
            <Card className="glass rounded-[2.5rem] overflow-hidden border-white/10 shadow-xl">
              <CardContent className="p-4 space-y-4">
                {friendMeals.map((m) => (
                  <Link key={m.id} href={`/amigos`} className="flex items-center gap-4 p-3 hover:bg-white/5 rounded-2xl transition-all ios-btn group">
                    <div className="w-12 h-12 rounded-xl bg-secondary/50 overflow-hidden relative shrink-0">
                      {m.photoDataUri ? (
                        <img src={m.photoDataUri} alt={m.friendName} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-primary font-bold">{m.friendName[0]}</div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-sm truncate">{m.friendName}</p>
                        <span className="text-[9px] font-bold text-muted-foreground opacity-50">Hoy</span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{m.mealType}</p>
                    </div>
                    <div className="flex items-center gap-1 bg-orange-500/10 px-2 py-1 rounded-full">
                        <Flame className="w-3 h-3 text-orange-500 fill-orange-500" />
                        <span className="text-[10px] font-bold text-orange-500">{m.totalCalories}</span>
                    </div>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </section>
        )}

        {prediction && (
          <Card className="glass rounded-[2.5rem] overflow-hidden relative group border-primary/20">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-accent/10 opacity-50" />
            <CardContent className="p-6 relative flex items-center gap-6">
              <div className="w-16 h-16 rounded-[1.5rem] bg-primary/20 flex items-center justify-center shadow-inner">
                <CalendarDays className="w-8 h-8 text-primary" />
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-70">Meta: {profile.targetWeight}kg ({profile.intensity})</p>
                <p className="text-xl font-bold leading-tight">Llegarás el <span className="text-primary drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">{prediction.date}</span></p>
                <p className="text-xs font-medium text-muted-foreground">Faltan {prediction.weeks} semanas al ritmo actual.</p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card className="glass rounded-[3rem] overflow-hidden border-white/20 relative shadow-2xl">
          <div className="absolute top-0 right-0 p-8">
             <div className="w-20 h-20 rounded-full border-4 border-secondary/30 flex items-center justify-center relative">
                <div className="absolute inset-0 rounded-full border-4 border-primary transition-all duration-1000" style={{ clipPath: `inset(${100-calPct}% 0 0 0)` }} />
                <span className="text-lg font-bold">{calPct.toFixed(0)}%</span>
             </div>
          </div>
          <CardContent className="p-10 space-y-8">
            <div className="space-y-1">
              <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Calorías Totales</span>
              <div className="flex items-baseline gap-2">
                <span className="text-7xl font-headline font-bold text-foreground tracking-tighter">{consumed.cal}</span>
                <span className="text-xl text-muted-foreground font-medium opacity-60">/ {profile.calorieGoal}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-6 pt-6 border-t border-white/10">
              <MacroCol label="Proteínas" value={consumed.prot} target={profile.proteinGoalGrams} unit="g" color="bg-primary" />
              <MacroCol label="Carbohidratos" value={consumed.carb} target={profile.carbohydrateGoalGrams} unit="g" color="bg-accent" />
              <MacroCol label="Grasas" value={consumed.fat} target={profile.fatGoalGrams} unit="g" color="bg-orange-500" />
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-6">
          <Card className="glass rounded-[2.5rem] p-8 space-y-4 border-white/10 shadow-xl relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-blue-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
            <Droplets className="w-8 h-8 text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
            <div>
              <p className="text-3xl font-headline font-bold">{waterConsumed} <span className="text-xs font-medium opacity-50">ml</span></p>
              <div className="h-1.5 w-full bg-secondary/30 rounded-full mt-3 overflow-hidden">
                <div className="h-full bg-blue-500 transition-all duration-700" style={{ width: `${waterPct}%` }} />
              </div>
            </div>
            <Button size="sm" onClick={handleAddWater} className="w-full bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 rounded-2xl font-bold h-10 ios-btn">+ 250ml</Button>
          </Card>

          <Card className="glass rounded-[2.5rem] p-8 space-y-4 border-white/10 shadow-xl relative overflow-hidden group">
            <div className="absolute -top-4 -right-4 w-16 h-16 bg-orange-500/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
            <Scale className="w-8 h-8 text-orange-400 drop-shadow-[0_0_8px_rgba(251,146,60,0.5)]" />
            <div>
              <p className="text-3xl font-headline font-bold">{profile.peso} <span className="text-xs font-medium opacity-50">kg</span></p>
              <p className="text-[9px] text-muted-foreground mt-3 font-bold uppercase tracking-widest">Objetivo: {profile.targetWeight}kg</p>
            </div>
            <Dialog open={weightDialogOpen} onOpenChange={setWeightDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="w-full rounded-2xl glass border-white/10 font-bold h-10 ios-btn">Actualizar</Button>
              </DialogTrigger>
              <DialogContent className="glass border-none rounded-[2.5rem]">
                <DialogHeader>
                  <DialogTitle className="sr-only">Actualizar Peso</DialogTitle>
                  <p className="text-xl font-bold text-center">Nuevo Peso</p>
                </DialogHeader>
                <div className="space-y-6 pt-4">
                  <Input type="number" placeholder="Ej. 75.5" className="glass h-14 rounded-2xl text-center text-2xl font-bold" value={newWeight} onChange={e => setNewWeight(e.target.value)} />
                  <Button className="w-full bg-primary h-14 font-bold rounded-2xl shadow-xl shadow-primary/20 ios-btn" onClick={handleLogWeight}>Guardar</Button>
                </div>
              </DialogContent>
            </Dialog>
          </Card>
        </div>

        <section className="space-y-6">
          <div className="flex justify-between items-center px-2">
            <h3 className="text-2xl font-headline font-bold flex items-center gap-3">
              <Utensils className="w-6 h-6 text-primary" /> Diario de Hoy
            </h3>
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{meals?.length || 0} Registros</span>
          </div>
          <div className="space-y-4">
            {meals?.length === 0 ? (
              <div className="py-24 text-center glass rounded-[3rem] border-dashed border-white/20 opacity-50 flex flex-col items-center gap-4">
                <Camera className="w-12 h-12 text-muted-foreground opacity-20" />
                <p className="text-muted-foreground font-medium">Aún no hay registros hoy.</p>
              </div>
            ) : (
              meals?.map(meal => (
                <div 
                  key={meal.id} 
                  className="glass p-5 rounded-[2.5rem] flex items-center gap-5 hover:bg-white/10 transition-all cursor-pointer border-white/10 group ios-btn shadow-lg"
                  onClick={() => setSelectedMeal(meal)}
                >
                  <div className="w-24 h-24 rounded-[1.8rem] bg-secondary/30 overflow-hidden shrink-0 border border-white/10 relative">
                    {meal.photoDataUri ? (
                      <img src={meal.photoDataUri} alt={meal.mealType} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center opacity-20"><Utensils className="w-8 h-8" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-foreground truncate text-xl tracking-tight">{meal.mealType}</h4>
                    <div className="flex flex-wrap gap-3 mt-2">
                      <div className="px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">{meal.totalCalories} kcal</div>
                      <div className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-bold uppercase tracking-wider">P: {meal.totalProteins}g</div>
                      <div className="px-3 py-1 rounded-full bg-white/5 text-muted-foreground text-[10px] font-bold uppercase flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {new Date(meal.logDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-6 h-6 text-muted-foreground opacity-30 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                </div>
              ))
            )}
          </div>
        </section>

        {/* Modal de Carga de IA */}
        <Dialog open={loadingSuggestion || loadingAdvice} onOpenChange={() => {}}>
          <DialogContent className="glass border-none max-w-xs p-10 rounded-[3rem] flex flex-col items-center justify-center text-center space-y-6 outline-none">
            <div className="relative">
              <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full animate-pulse" />
              <Loader2 className="w-16 h-16 animate-spin text-primary relative z-10" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-headline font-bold">Consultando a la IA</h3>
              <p className="text-sm text-muted-foreground font-medium px-4 leading-relaxed">
                {loadingSuggestion ? "Diseñando tu receta táctica perfecta..." : "Analizando tus macros y progreso..."}
              </p>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!advice} onOpenChange={() => setAdvice(null)}>
          <DialogContent className="glass border-none max-w-md p-10 rounded-[3rem]">
            <DialogHeader className="sr-only"><DialogTitle>Consejo IA</DialogTitle></DialogHeader>
            <div className="flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-[1.8rem] bg-accent/20 flex items-center justify-center shadow-xl shadow-accent/20 animate-float">
                <BrainCircuit className="w-10 h-10 text-accent" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-headline font-bold">Feedback del Coach</h2>
                <div className={cn(
                  "inline-block px-4 py-1.5 rounded-full font-bold text-[10px] uppercase tracking-widest",
                  advice?.estado === 'excelente' ? "bg-emerald-500/20 text-emerald-400" :
                  advice?.estado === 'en_progreso' ? "bg-primary/20 text-primary" : "bg-orange-500/20 text-orange-400"
                )}>
                  {advice?.estado.replace('_', ' ')}
                </div>
              </div>
              <p className="text-lg leading-relaxed text-foreground/80 font-medium">{advice?.consejo}</p>
              <div className="w-full bg-secondary/30 p-6 rounded-[2rem] space-y-2 border border-white/5">
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Recomendación Clave</p>
                <p className="font-bold text-accent text-xl">{advice?.sugerenciaComida}</p>
              </div>
              <Button className="w-full h-16 rounded-[1.8rem] text-lg font-bold bg-primary ios-btn shadow-2xl shadow-primary/20" onClick={() => setAdvice(null)}>Recibido</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={!!mealSuggestion} onOpenChange={() => setMealSuggestion(null)}>
          <DialogContent className="glass border-none max-w-lg max-h-[90vh] overflow-y-auto p-0 rounded-[3rem] gap-0">
            <DialogHeader className="p-10 bg-gradient-to-br from-primary/10 to-transparent">
              <div className="flex justify-between items-center w-full">
                <div className="w-16 h-16 rounded-[1.5rem] bg-primary/20 flex items-center justify-center shadow-lg">
                   <ChefHat className="w-10 h-10 text-primary" />
                </div>
                <div className="flex gap-2">
                  <NutrientBadge label="Cal" value={mealSuggestion?.macrosEstimados.cal || 0} unit="" color="text-primary" />
                  <NutrientBadge label="P" value={mealSuggestion?.macrosEstimados.prot || 0} unit="g" color="text-accent" />
                </div>
              </div>
              <DialogTitle className="mt-6 text-4xl font-headline font-bold text-foreground leading-tight">{mealSuggestion?.nombrePlato}</DialogTitle>
              <p className="text-muted-foreground mt-4 leading-relaxed text-lg italic opacity-80">"{mealSuggestion?.descripcion}"</p>
            </DialogHeader>
            <div className="p-10 space-y-10">
              <div className="space-y-5">
                <h4 className="text-xs font-bold uppercase tracking-[0.3em] text-primary flex items-center gap-3">
                  <Utensils className="w-4 h-4" /> Ingredientes Seleccionados
                </h4>
                <div className="grid grid-cols-1 gap-3">
                  {mealSuggestion?.ingredientes.map((ing, i) => (
                    <div key={i} className="flex items-center gap-4 glass p-4 rounded-2xl border-white/5">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                      <span className="text-sm font-medium">{ing}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <Button variant="outline" className="flex-1 h-16 rounded-2xl glass font-bold ios-btn" onClick={() => setMealSuggestion(null)}>Quizá luego</Button>
                <Button 
                  className="flex-[2] h-16 rounded-2xl bg-primary hover:bg-primary/90 font-bold gap-3 shadow-2xl shadow-primary/30 ios-btn text-lg"
                  onClick={handleSaveFavorite}
                  disabled={savingFavorite}
                >
                  {savingFavorite ? <Loader2 className="animate-spin" /> : <Save className="w-6 h-6" />}
                  Guardar Receta
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {selectedMeal && (
          <Dialog open={!!selectedMeal} onOpenChange={() => setSelectedMeal(null)}>
            <DialogContent className="glass border-none p-0 overflow-hidden sm:max-w-md max-h-[90vh] rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)]">
              <DialogHeader className="sr-only">
                <DialogTitle>{selectedMeal.mealType}</DialogTitle>
              </DialogHeader>
              <div className="relative aspect-square w-full bg-secondary/50">
                {selectedMeal.photoDataUri ? (
                  <img src={selectedMeal.photoDataUri} alt={selectedMeal.mealType} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center opacity-20">
                    <Utensils className="w-16 h-16" />
                  </div>
                )}
                <div className="absolute top-6 left-6 right-6 flex justify-between">
                   <div className="glass px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                     <Clock className="w-3 h-3" /> {new Date(selectedMeal.logDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                   </div>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="glass bg-destructive/20 text-destructive hover:bg-destructive h-12 w-12 rounded-[1.2rem] ios-btn"
                    onClick={() => handleDeleteMeal(selectedMeal.id)}
                  >
                    <Trash2 className="w-6 h-6" />
                  </Button>
                </div>
              </div>
              
              <div className="p-10 space-y-8">
                <h2 className="text-4xl font-headline font-bold text-foreground tracking-tight">{selectedMeal.mealType}</h2>
                <div className="grid grid-cols-2 gap-4">
                  <NutrientBox label="Calorías" value={selectedMeal.totalCalories} unit="kcal" color="text-primary" />
                  <NutrientBox label="Proteínas" value={selectedMeal.totalProteins} unit="g" color="text-accent" />
                  <NutrientBox label="Carbohidratos" value={selectedMeal.totalCarbohydrates} unit="g" color="text-orange-500" />
                  <NutrientBox label="Grasas" value={selectedMeal.totalFats} unit="g" color="text-emerald-500" />
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </main>
    </div>
  );
}

function MacroCol({ label, value, target, unit, color }: any) {
  const pct = Math.min((value / target) * 100, 100);
  return (
    <div className="space-y-3">
      <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.2em] text-foreground px-1">
        <span className="opacity-70">{label}</span>
        <span className="opacity-100">{value}{unit} <span className="text-muted-foreground opacity-40">/ {target}{unit}</span></span>
      </div>
      <div className="h-4 w-full bg-secondary/20 rounded-full overflow-hidden border border-white/5 shadow-inner">
        <div 
          className={cn("h-full transition-all duration-1000 relative", color)} 
          style={{ width: `${pct}%` }} 
        >
          <div className="absolute inset-0 bg-white/20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}

function NutrientBox({ label, value, unit, color }: { label: string, value: number, unit: string, color: string }) {
  return (
    <div className="glass bg-white/5 p-6 rounded-[2rem] border-white/5 flex flex-col items-center justify-center text-center">
      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.3em] mb-2">{label}</p>
      <p className={`text-3xl font-bold ${color} tracking-tighter`}>{value}<span className="text-sm font-medium opacity-50 ml-1">{unit}</span></p>
    </div>
  );
}

function NutrientBadge({ label, value, unit, color }: { label: string, value: number, unit: string, color: string }) {
  return (
    <div className="glass px-4 py-2 rounded-2xl border-white/10 flex items-center gap-2">
      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{label}:</span>
      <span className={cn("text-sm font-bold", color)}>{value}{unit}</span>
    </div>
  );
}
