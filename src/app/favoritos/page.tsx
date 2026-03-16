
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ChefHat, Trash2, Utensils } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function FavoritosPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();

  const favoritesQuery = useMemoFirebase(() => user ? query(
    collection(db, 'users', user.uid, 'favoriteRecipes'),
    orderBy('createdAt', 'desc')
  ) : null, [db, user]);
  
  const { data: favorites, isLoading } = useCollection<any>(favoritesQuery);

  const handleDelete = async (id: string) => {
    if (!user) return;
    await deleteDoc(doc(db, 'users', user.uid, 'favoriteRecipes', id));
  };

  if (isUserLoading || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Abriendo tu libro de cocina...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent pb-48">
      <main className="max-w-2xl mx-auto px-6 pt-10 space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-headline font-bold">Mis Favoritos</h1>
          <p className="text-muted-foreground font-medium">Recetas personalizadas guardadas</p>
        </header>

        {favorites?.length === 0 ? (
          <div className="py-20 text-center glass rounded-3xl border-dashed border-border opacity-50">
            <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p>Aún no has guardado ninguna receta.</p>
            <p className="text-xs">Usa el Chef IA en el Dashboard para generar sugerencias.</p>
          </div>
        ) : (
          <div className="space-y-4 pb-10">
            {favorites?.map((recipe) => (
              <Card key={recipe.id} className="glass border-none shadow-xl overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-headline text-primary">{recipe.nombrePlato}</CardTitle>
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 ios-btn" onClick={() => handleDelete(recipe.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{recipe.descripcion}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-4 p-3 bg-secondary/30 rounded-2xl text-[10px] font-bold uppercase tracking-tight">
                    <span className="text-primary">{recipe.macros.cal} kcal</span>
                    <span className="text-accent">P: {recipe.macros.prot}g</span>
                    <span className="text-orange-500">C: {recipe.macros.carb}g</span>
                    <span className="text-emerald-500">G: {recipe.macros.fat}g</span>
                  </div>
                  
                  <Accordion type="single" collapsible className="w-full">
                    <AccordionItem value="ingredients" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-2">
                        <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                          <Utensils className="w-3 h-3" /> Ingredientes
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <ul className="space-y-1 mt-2">
                          {recipe.ingredientes.map((ing: string, i: number) => (
                            <li key={i} className="text-sm text-muted-foreground flex items-center gap-2">
                              <div className="w-1 h-1 rounded-full bg-primary" /> {ing}
                            </li>
                          ))}
                        </ul>
                      </AccordionContent>
                    </AccordionItem>
                    
                    <AccordionItem value="instructions" className="border-none">
                      <AccordionTrigger className="hover:no-underline py-2">
                        <span className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2">
                          <ChefHat className="w-3 h-3" /> Preparación
                        </span>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-3 mt-2">
                          {recipe.instrucciones.map((inst: string, i: number) => (
                            <div key={i} className="flex gap-3">
                              <span className="text-xs font-bold text-primary opacity-50">{i + 1}</span>
                              <p className="text-sm text-muted-foreground leading-relaxed">{inst}</p>
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
