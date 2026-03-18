
"use client";

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useFirestore, addDocumentNonBlocking, useDoc, useMemoFirebase } from '@/firebase';
import { collection, doc, updateDoc, getDoc } from 'firebase/firestore';
import { BottomNav } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, Loader2, Sparkles, CheckCircle, AlertCircle, RefreshCw, ChevronLeft } from 'lucide-react';
import type { AnalyzeMealPhotoForNutrientsOutput } from '@/ai/flows/analyze-meal-photo-for-nutrients';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { UserProfile } from '@/lib/types';
import getApiUrl from '@/lib/api';

export default function RegistrarPage() {
  const { user } = useUser();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [photo, setPhoto] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<any>(null);
  const [mealName, setMealName] = useState('');

  const userDocRef = useMemoFirebase(() => user ? doc(db, 'users', user.uid) : null, [db, user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const dataUri = reader.result as string;
        setPhoto(dataUri);
        runAnalysis(dataUri);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async (dataUri: string) => {
    setAnalyzing(true);
    setError(null);
    try {
      const payload = {
        flow: 'analyze',
        input: {
          photoDataUri: dataUri,
          mealDescription: mealName
        }
      };

      const res = await fetch(getApiUrl('/api/ai'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('AI service error');

      const result: AnalyzeMealPhotoForNutrientsOutput = await res.json();
      setAnalysisResult(result);
      if (!mealName) setMealName("Nueva Comida");
    } catch (err) {
      setError('La IA no pudo procesar la imagen automáticamente. Reintenta o ingresa datos.');
      console.error(err);
    } finally {
      setAnalyzing(false);
    }
  };

  const saveMeal = async () => {
    if (!user || !userDocRef) return;
    if (!mealName) {
      setError('Dale un nombre a tu comida.');
      return;
    }

    setSaving(true);
    try {
      // 1. Calcular Racha
      const profileSnap = await getDoc(userDocRef);
      if (profileSnap.exists()) {
        const profile = profileSnap.data() as UserProfile;
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        
        let newStreak = profile.streak || 0;
        let lastLog = profile.lastLogDate || '';

        if (lastLog !== today) {
          if (lastLog === yesterday) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }
          await updateDoc(userDocRef, {
            streak: newStreak,
            lastLogDate: today
          });
        }
      }

      // 2. Guardar comida
      const finalData = analysisResult || { calories: 0, protein: 0, carbohydrates: 0, fats: 0, analysisRaw: '{}' };
      const mealLog = {
        userId: user.uid,
        logDateTime: new Date().toISOString(),
        mealType: mealName,
        totalCalories: Math.round(finalData.calories),
        totalProteins: Math.round(finalData.protein),
        totalCarbohydrates: Math.round(finalData.carbohydrates),
        totalFats: Math.round(finalData.fats),
        photoDataUri: photo,
        analysisRaw: finalData.analysisRaw
      };

      await addDocumentNonBlocking(collection(db, 'users', user.uid, 'mealLogs'), mealLog);
      
      toast({
        title: "¡Comida registrada!",
        description: `${mealLog.totalCalories} kcal añadidas a tu diario.`,
      });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
      setError('Error al guardar el registro.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent pb-40">
      <main className="pt-10 px-6 max-w-md mx-auto space-y-8">
        <header className="flex items-center gap-4">
          <Link href="/dashboard" className="glass h-12 w-12 rounded-2xl flex items-center justify-center ios-btn">
             <ChevronLeft className="w-6 h-6" />
          </Link>
          <div className="flex-1 text-center pr-12">
            <h1 className="text-3xl font-headline font-bold">IA Scanner</h1>
            <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest opacity-60">Análisis Nutricional</p>
          </div>
        </header>

        {!photo ? (
          <div className="grid grid-cols-1 gap-6 mt-8">
            <Button 
              className="h-72 rounded-[3.5rem] glass border-2 border-dashed border-primary/30 flex flex-col gap-6 text-muted-foreground hover:bg-primary/5 transition-all group ios-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-20 h-20 rounded-[1.8rem] bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform shadow-xl">
                <Camera className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center space-y-1">
                <p className="font-bold text-foreground text-xl">Capturar Plato</p>
                <p className="text-xs font-medium opacity-60">Saca una foto para analizar macros</p>
              </div>
            </Button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileChange} 
              accept="image/*" 
              className="hidden" 
            />
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative aspect-square rounded-[3.5rem] overflow-hidden glass border-white/20 shadow-2xl group">
              <img src={photo} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000" />
              {analyzing && (
                <div className="absolute inset-0 bg-background/60 backdrop-blur-2xl flex flex-col items-center justify-center text-center p-10">
                  <div className="relative mb-8">
                    <div className="absolute inset-0 bg-primary/30 blur-3xl rounded-full animate-pulse" />
                    <Loader2 className="w-16 h-16 animate-spin text-primary relative z-10" />
                  </div>
                  <h2 className="font-headline font-bold text-3xl text-foreground">Escaneando...</h2>
                  <p className="text-sm font-medium text-muted-foreground mt-3 opacity-80 leading-relaxed">Nuestra IA está identificando los ingredientes de tu plato</p>
                </div>
              )}
              {!analyzing && analysisResult && (
                <div className="absolute top-6 left-6 right-6 flex justify-between">
                   <div className="glass px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary">IA Completada</div>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="space-y-3 px-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground opacity-70">Identificación</Label>
                <Input 
                  placeholder="Dale un nombre a tu plato..." 
                  className="glass h-16 rounded-[1.5rem] text-xl font-bold px-6 border-white/10"
                  value={mealName}
                  onChange={e => setMealName(e.target.value)}
                />
              </div>

              {error && (
                <Alert variant="destructive" className="rounded-[2rem] glass border-destructive/30 bg-destructive/10">
                  <AlertCircle className="h-5 w-5" />
                  <AlertTitle className="font-bold">IA con dudas</AlertTitle>
                  <AlertDescription className="text-xs font-medium opacity-80">{error}</AlertDescription>
                </Alert>
              )}

              {analysisResult && (
                <Card className="glass border-none shadow-2xl rounded-[3rem] overflow-hidden">
                  <CardContent className="p-8 space-y-6">
                    <div className="flex items-center gap-3 text-primary">
                      <Sparkles className="w-5 h-5 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                      <span className="text-[10px] font-bold uppercase tracking-[0.3em] opacity-80">Estimación Nutricional</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <NutrientBadge label="Calorías" value={Math.round(analysisResult.calories)} unit="kcal" color="text-primary" />
                      <NutrientBadge label="Proteínas" value={Math.round(analysisResult.protein)} unit="g" color="text-accent" />
                      <NutrientBadge label="Carbohidratos" value={Math.round(analysisResult.carbohydrates)} unit="g" color="text-orange-500" />
                      <NutrientBadge label="Grasas" value={Math.round(analysisResult.fats)} unit="g" color="text-emerald-500" />
                    </div>
                  </CardContent>
                </Card>
              )}

              <div className="flex gap-4 pt-4">
                <Button 
                  variant="outline" 
                  className="flex-1 gap-2 h-16 rounded-[1.5rem] glass border-white/10 hover:bg-white/5 ios-btn font-bold"
                  onClick={() => { setPhoto(null); setAnalysisResult(null); setMealName(''); }}
                  disabled={saving}
                >
                  <RefreshCw className="w-5 h-5" /> Reset
                </Button>
                <Button 
                  className="flex-[2] bg-primary hover:bg-primary/90 text-white font-bold h-16 rounded-[1.5rem] shadow-2xl shadow-primary/30 ios-btn text-lg"
                  onClick={saveMeal}
                  disabled={analyzing || saving || !photo}
                >
                  {saving ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <CheckCircle className="w-6 h-6 mr-2" />}
                  Confirmar Comida
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
      <BottomNav />
    </div>
  );
}

function NutrientBadge({ label, value, unit, color }: { label: string, value: number, unit: string, color: string }) {
  return (
    <div className="glass bg-white/5 p-5 rounded-[1.8rem] border-white/5 flex flex-col items-center text-center">
      <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest mb-1.5 opacity-60">{label}</p>
      <p className={`text-2xl font-bold ${color} tracking-tighter`}>{value}<span className="text-xs font-medium opacity-50 ml-0.5">{unit}</span></p>
    </div>
  );
}
