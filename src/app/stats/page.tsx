
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Bar, BarChart, XAxis, YAxis, Cell, Line, LineChart, ResponsiveContainer, CartesianGrid, Tooltip, PieChart, Pie, Sector, Label, RadialBarChart, RadialBar, PolarGrid, PolarAngleAxis } from 'recharts';
import { Loader2, TrendingDown, Scale, Flame, Zap, Target, Droplets, PieChart as PieIcon, Activity, CheckCircle2 } from 'lucide-react';
import { MealRecord, WeightLog, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useMemo } from 'react';

export default function StatsPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const userDocRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);
  const { data: profile } = useDoc<UserProfile>(userDocRef);

  const mealsQuery = useMemoFirebase(() => user ? query(
    collection(db, 'users', user.uid, 'mealLogs'),
    orderBy('logDateTime', 'desc'),
    limit(50)
  ) : null, [db, user]);
  const { data: meals } = useCollection<MealRecord>(mealsQuery);

  const weightQuery = useMemoFirebase(() => user ? query(
    collection(db, 'users', user.uid, 'weightLogs'),
    orderBy('logDate', 'asc'),
    limit(14)
  ) : null, [db, user]);
  const { data: weightLogs } = useCollection<WeightLog>(weightQuery);

  // Cálculos de tendencias
  const calorieTrend = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const dateStr = d.toISOString().split('T')[0];
      const dayMeals = (meals || []).filter(m => m.logDateTime.startsWith(dateStr));
      const totalCal = dayMeals.reduce((sum, m) => sum + (m.totalCalories || 0), 0);
      return {
        name: d.toLocaleDateString('es-ES', { weekday: 'short' }),
        cal: totalCal,
        goal: profile?.calorieGoal || 2000,
      };
    });
  }, [meals, profile]);

  const macroDistribution = useMemo(() => {
    if (!meals || meals.length === 0) return [];
    const totals = meals.reduce((acc, m) => ({
      p: acc.p + (m.totalProteins || 0),
      c: acc.c + (m.totalCarbohydrates || 0),
      f: acc.f + (m.totalFats || 0),
    }), { p: 0, c: 0, f: 0 });
    
    const total = totals.p + totals.c + totals.f || 1;
    return [
      { name: 'Proteínas', value: Math.round((totals.p / total) * 100), fill: 'hsl(var(--primary))' },
      { name: 'Carbohidratos', value: Math.round((totals.c / total) * 100), fill: 'hsl(var(--accent))' },
      { name: 'Grasas', value: Math.round((totals.f / total) * 100), fill: 'hsl(var(--orange-500))' },
    ];
  }, [meals]);

  const weightData = (weightLogs || []).map(log => ({
    date: new Date(log.logDate).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
    peso: log.weightKg
  }));

  const weightProgress = useMemo(() => {
    if (!profile || !profile.peso || !profile.targetWeight) return 0;
    const startWeight = weightLogs && weightLogs.length > 0 ? weightLogs[0].weightKg : profile.peso;
    const totalDiff = Math.abs(startWeight - profile.targetWeight);
    const currentDiff = Math.abs(profile.peso - profile.targetWeight);
    if (totalDiff === 0) return 100;
    return Math.min(Math.max(0, 100 - (currentDiff / totalDiff * 100)), 100);
  }, [profile, weightLogs]);

  if (isUserLoading || !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse font-headline font-bold text-xl">Analizando biometría...</p>
      </div>
    );
  }

  const calorieConfig = {
    cal: { label: 'Consumido', color: 'hsl(var(--primary))' },
    goal: { label: 'Objetivo', color: 'hsl(var(--muted-foreground) / 0.5)' },
  } satisfies ChartConfig;

  return (
    <div className="min-h-screen bg-transparent pb-48">
      <main className="max-w-2xl mx-auto px-6 pt-10 space-y-10">
        <header className="space-y-1">
          <h1 className="text-4xl font-headline font-bold text-foreground tracking-tighter">BioMetría Pro</h1>
          <p className="text-muted-foreground font-medium flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" /> Análisis de rendimiento avanzado
          </p>
        </header>

        {/* Resumen de Meta de Peso */}
        <section className="grid grid-cols-1 gap-6">
          <Card className="glass border-none shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
              <Scale className="w-24 h-24 text-primary" />
            </div>
            <CardContent className="p-8 space-y-6">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground">Progreso de Meta</p>
                  <h3 className="text-3xl font-headline font-bold">{profile.peso} <span className="text-sm font-medium opacity-50">kg</span></h3>
                </div>
                <div className="text-right space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-primary">Objetivo</p>
                  <h3 className="text-xl font-headline font-bold text-primary">{profile.targetWeight} <span className="text-xs font-medium opacity-50">kg</span></h3>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest px-1">
                  <span>{weightProgress.toFixed(0)}% Completado</span>
                  <span className="text-primary">{Math.abs(profile.peso - (profile.targetWeight || profile.peso)).toFixed(1)} kg restantes</span>
                </div>
                <div className="h-4 w-full bg-secondary/20 rounded-full overflow-hidden border border-white/5 shadow-inner">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 relative" 
                    style={{ width: `${weightProgress}%` }} 
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* Gráfico de Tendencia de Peso */}
        <section className="space-y-6">
          <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3 px-2">
            <TrendingDown className="w-4 h-4 text-orange-500" /> Historial de Peso (14 días)
          </h3>
          <Card className="glass border-none shadow-2xl p-8 rounded-[3rem]">
            <div className="h-[250px] w-full">
              {weightData.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weightData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--muted-foreground) / 0.1)" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }}
                    />
                    <YAxis 
                      hide 
                      domain={['dataMin - 2', 'dataMax + 2']}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.1)', 
                        border: 'none', 
                        borderRadius: '24px', 
                        backdropFilter: 'blur(20px)',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.3)',
                        color: 'hsl(var(--foreground))'
                      }}
                      itemStyle={{ color: 'hsl(var(--primary))', fontSize: '14px', fontWeight: 'bold' }}
                      labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px', fontWeight: 'bold' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="peso" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={5} 
                      dot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 4, stroke: 'hsl(var(--background))' }}
                      activeDot={{ r: 10, strokeWidth: 0, fill: 'hsl(var(--primary))' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                  <div className="w-16 h-16 rounded-full border-2 border-dashed border-muted-foreground flex items-center justify-center">
                    <Scale className="w-8 h-8" />
                  </div>
                  <p className="text-sm font-medium max-w-[200px]">Registra tu peso diariamente para generar tu línea de tendencia.</p>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* Balance Calórico y Distribución de Macros */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3 px-2">
              <Flame className="w-4 h-4 text-primary" /> Calorías vs Meta
            </h3>
            <Card className="glass border-none shadow-2xl p-6 rounded-[2.5rem] flex flex-col justify-center min-h-[300px]">
              <ChartContainer config={calorieConfig} className="h-[200px] w-full">
                <BarChart data={calorieTrend}>
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10, fontWeight: 'bold' }} 
                  />
                  <YAxis hide />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="cal" radius={[6, 6, 0, 0]}>
                    {calorieTrend.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.cal > entry.goal ? 'hsl(var(--destructive))' : 'hsl(var(--primary))'} 
                        fillOpacity={0.8}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ChartContainer>
              <div className="mt-4 flex justify-center gap-6">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-primary" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Dentro de Meta</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-destructive" />
                  <span className="text-[10px] font-bold uppercase tracking-widest opacity-60">Superávit</span>
                </div>
              </div>
            </Card>
          </section>

          <section className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground flex items-center gap-3 px-2">
              <PieIcon className="w-4 h-4 text-accent" /> Mix de Nutrientes
            </h3>
            <Card className="glass border-none shadow-2xl p-6 rounded-[2.5rem] flex flex-col items-center justify-center min-h-[300px]">
              {macroDistribution.length > 0 ? (
                <div className="h-[220px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={macroDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={8}
                        dataKey="value"
                      >
                        {macroDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} stroke="transparent" />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0,0,0,0.8)', 
                          border: 'none', 
                          borderRadius: '16px',
                          color: '#fff'
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-tighter">Promedio</span>
                    <span className="text-2xl font-bold font-headline">Macros</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground opacity-50">Sin datos de comidas.</p>
              )}
              <div className="grid grid-cols-3 gap-4 w-full mt-4">
                 {macroDistribution.map(m => (
                   <div key={m.name} className="text-center space-y-1">
                      <p className="text-[9px] font-bold uppercase tracking-widest opacity-60 truncate">{m.name.substring(0,4)}</p>
                      <p className="text-sm font-bold" style={{ color: m.fill }}>{m.value}%</p>
                   </div>
                 ))}
              </div>
            </Card>
          </section>
        </div>

        {/* Métricas de Rendimiento */}
        <section className="grid grid-cols-2 gap-6 pb-20">
          <Card className="glass border-none p-8 space-y-4 shadow-xl bg-white/5 relative overflow-hidden group">
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:rotate-12 transition-transform">
              <CheckCircle2 className="w-20 h-20 text-emerald-500" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em]">Días en Meta</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-4xl font-headline font-bold text-emerald-500">
                    {calorieTrend.filter(t => t.cal > 0 && t.cal <= t.goal).length}
                  </p>
                  <p className="text-xs font-bold opacity-40">/ 7 días</p>
                </div>
            </div>
          </Card>

          <Card className="glass border-none p-8 space-y-4 shadow-xl bg-white/5 relative overflow-hidden group">
            <div className="absolute -bottom-4 -right-4 opacity-5 group-hover:-rotate-12 transition-transform">
              <Zap className="w-20 h-20 text-primary" />
            </div>
            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center shadow-lg shadow-primary/10">
                <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
                <p className="text-[10px] font-bold uppercase text-muted-foreground tracking-[0.2em]">Eficiencia</p>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className="text-4xl font-headline font-bold text-primary">A+</p>
                  <p className="text-xs font-bold opacity-40">NutriScore</p>
                </div>
            </div>
          </Card>
        </section>
      </main>
    </div>
  );
}
