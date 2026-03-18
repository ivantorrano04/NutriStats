"use client";

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, getDoc, writeBatch, orderBy, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UserPlus, Check, X, Users, Activity, Utensils, ChevronRight, Flame } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Friendship, UserProfile, MealRecord } from '@/lib/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export default function AmigosPage() {
  const { user, isUserLoading } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [searchId, setSearchId] = useState('');
  const [searching, setSearching] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState<string | null>(null);

  const friendshipsQuery = useMemoFirebase(() => user ? query(
    collection(db, 'users', user.uid, 'friendships')
  ) : null, [db, user]);
  const { data: friendships, isLoading: loadingFriendships } = useCollection<Friendship>(friendshipsQuery);

  const pendingReceived = friendships?.filter(f => f.status === 'pending_received') || [];
  const acceptedFriends = friendships?.filter(f => f.status === 'accepted') || [];

  const sendRequest = async () => {
    if (!user || !searchId || searchId === user.uid) return;
    setSearching(true);
    try {
      const targetRef = doc(db, 'users', searchId);
      const targetSnap = await getDoc(targetRef);
      
      if (!targetSnap.exists()) {
        toast({ variant: 'destructive', title: 'Usuario no encontrado', description: 'Comprueba el ID del amigo.' });
        return;
      }

      const targetData = targetSnap.data() as UserProfile;
      const mySnap = await getDoc(doc(db, 'users', user.uid));
      const myName = mySnap.data()?.name || 'Un usuario';

      const batch = writeBatch(db);
      
      const myFriendshipRef = doc(db, 'users', user.uid, 'friendships', searchId);
      batch.set(myFriendshipRef, {
        friendId: searchId,
        friendName: targetData.name,
        status: 'pending_sent',
        updatedAt: new Date().toISOString()
      });

      const theirFriendshipRef = doc(db, 'users', searchId, 'friendships', user.uid);
      batch.set(theirFriendshipRef, {
        friendId: user.uid,
        friendName: myName,
        status: 'pending_received',
        updatedAt: new Date().toISOString()
      });

      const notificationRef = doc(collection(db, 'users', searchId, 'notifications'));
      batch.set(notificationRef, {
        userId: searchId,
        title: 'Nueva solicitud de amistad',
        message: `${myName} quiere ser tu amigo.`,
        type: 'friend_request',
        read: false,
        createdAt: new Date().toISOString()
      });

      batch.commit().then(() => {
        toast({ title: 'Solicitud enviada', description: `Se ha enviado la solicitud a ${targetData.name}` });
        setSearchId('');
      }).catch(err => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          operation: 'write',
          path: `users/${searchId}/friendships`
        }));
      });

    } catch (e) {
      console.error(e);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo enviar la solicitud.' });
    } finally {
      setSearching(false);
    }
  };

  const respondRequest = (friendId: string, accept: boolean) => {
    if (!user) return;
    const batch = writeBatch(db);
    if (accept) {
      batch.update(doc(db, 'users', user.uid, 'friendships', friendId), { status: 'accepted', updatedAt: new Date().toISOString() });
      batch.update(doc(db, 'users', friendId, 'friendships', user.uid), { status: 'accepted', updatedAt: new Date().toISOString() });
    } else {
      batch.delete(doc(db, 'users', user.uid, 'friendships', friendId));
      batch.delete(doc(db, 'users', friendId, 'friendships', user.uid));
    }
    batch.commit().catch(err => {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        operation: 'write',
        path: `users/${user.uid}/friendships`
      }));
    });
  };

  if (isUserLoading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>;

  return (
    <div className="min-h-screen bg-transparent pb-48">
      <main className="max-w-2xl mx-auto px-6 pt-10 space-y-8">
        <header className="space-y-1">
          <h1 className="text-3xl font-headline font-bold text-primary">Comunidad NutriScan</h1>
          <p className="text-muted-foreground">Conecta y comparte tu progreso con amigos</p>
        </header>

        <Card className="glass border-none shadow-xl">
          <CardContent className="pt-6 space-y-4">
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Tu ID NutriScan</p>
              <div className="flex gap-2">
                <code className="bg-secondary/50 p-3 rounded-xl flex-1 font-mono text-xs truncate select-all text-foreground">{user?.uid}</code>
                <Button variant="secondary" className="rounded-xl ios-btn" onClick={() => { navigator.clipboard.writeText(user?.uid || ''); toast({ title: 'ID Copiado' }); }}>Copiar</Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="Pega el ID de tu amigo..." 
                className="glass rounded-xl text-foreground" 
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
              />
              <Button onClick={sendRequest} disabled={searching || !searchId} className="rounded-xl bg-primary hover:bg-primary/90 ios-btn">
                {searching ? <Loader2 className="animate-spin" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Invitar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass p-1 rounded-2xl">
            <TabsTrigger value="friends" className="rounded-xl font-bold text-foreground">Amigos ({acceptedFriends.length})</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl font-bold text-foreground">Solicitudes ({pendingReceived.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="pt-6 space-y-4">
            {acceptedFriends.length === 0 ? (
              <div className="text-center py-20 opacity-50 bg-secondary/10 rounded-3xl border-2 border-dashed border-border">
                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="font-medium text-foreground">¿Te sientes solo? ¡Invita a tu primer amigo!</p>
              </div>
            ) : (
              acceptedFriends.map(f => (
                <Card key={f.friendId} className="glass border-none cursor-pointer hover:bg-white/5 dark:hover:bg-white/5 transition-all group overflow-hidden" onClick={() => setSelectedFriend(f.friendId)}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center font-bold text-white text-xl shadow-lg">
                        {f.friendName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-lg text-foreground">{f.friendName}</p>
                        <p className="text-[10px] text-accent font-bold uppercase tracking-wider">Ver actividad de hoy</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="pt-6 space-y-4">
            {pendingReceived.length === 0 ? (
              <div className="text-center py-20 opacity-30">
                <UserPlus className="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-foreground">Sin solicitudes pendientes.</p>
              </div>
            ) : (
              pendingReceived.map(f => (
                <Card key={f.friendId} className="glass border-none">
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center font-bold text-xs text-foreground">{f.friendName.charAt(0)}</div>
                       <p className="font-bold text-foreground">{f.friendName}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" className="bg-emerald-500 hover:bg-emerald-600 h-9 w-9 rounded-xl ios-btn text-white" onClick={() => respondRequest(f.friendId, true)}>
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="destructive" className="h-9 w-9 rounded-xl ios-btn" onClick={() => respondRequest(f.friendId, false)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>

        {selectedFriend && (
          <FriendViewModal 
            friendId={selectedFriend} 
            onClose={() => setSelectedFriend(null)} 
          />
        )}
      </main>
    </div>
  );
}

function FriendViewModal({ friendId, onClose }: { friendId: string, onClose: () => void }) {
  const { user: currentUser } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const [reacting, setReacting] = useState(false);
  
  const friendDocRef = useMemoFirebase(() => doc(db, 'users', friendId), [db, friendId]);
  const { data: profile } = useDoc<UserProfile>(friendDocRef);

  const today = new Date().toISOString().split('T')[0];
  const mealsQuery = useMemoFirebase(() => query(
    collection(db, 'users', friendId, 'mealLogs'),
    where('logDateTime', '>=', today),
    orderBy('logDateTime', 'desc')
  ), [db, friendId, today]);
  const { data: meals } = useCollection<MealRecord>(mealsQuery);

  const consumed = (meals || []).reduce((acc, m) => acc + (m.totalCalories || 0), 0);
  const goal = profile?.calorieGoal || 2000;
  const calPct = Math.min((consumed / goal) * 100, 100);

  const handleSendFire = async () => {
    if (!currentUser || !profile || reacting) return;
    setReacting(true);
    try {
      await addDoc(collection(db, 'users', friendId, 'notifications'), {
        userId: friendId,
        title: '¡Fuego! 🔥',
        message: `${currentUser.displayName || 'Tu amigo'} ha celebrado tu progreso de hoy.`,
        type: 'praise',
        read: false,
        createdAt: new Date().toISOString()
      });
      toast({ title: '¡Reacción enviada! 🔥', description: `Has felicitado a ${profile.name}` });
    } catch (e) {
      console.error(e);
    } finally {
      setReacting(false);
    }
  };

  return (
    <Dialog open={!!friendId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-background dark:bg-card border-none sm:max-w-lg max-h-[85vh] overflow-y-auto p-0 gap-0 rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.3)] dark:shadow-[0_50px_100px_rgba(0,0,0,0.6)] [&>button]:hidden">
        <DialogHeader className="p-8 bg-background/95 dark:bg-card/95 sticky top-0 z-20 backdrop-blur-xl border-b border-border/50">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="text-2xl font-headline flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center font-bold text-white text-3xl shadow-2xl shadow-primary/30">
                {profile?.name?.charAt(0)}
              </div>
              <div className="text-left space-y-0.5">
                <p className="font-bold text-2xl tracking-tight text-foreground">{profile?.name}</p>
                <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 uppercase tracking-widest opacity-70">
                  <Activity className="w-3 h-3" /> Meta: {profile?.objetivo?.replace('_', ' ')}
                </p>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                variant="secondary" 
                className="rounded-full h-12 w-12 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/20 ios-btn shadow-lg"
                onClick={handleSendFire}
                disabled={reacting}
              >
                {reacting ? <Loader2 className="animate-spin w-5 h-5" /> : <Flame className="w-6 h-6 fill-orange-500" />}
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-12 w-12 hover:bg-secondary/80 ios-btn">
                  <X className="w-6 h-6 text-foreground" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-8 space-y-10">
          <section className="space-y-5">
            <div className="flex justify-between items-end px-1">
              <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-80">Progreso Calórico</h3>
              <span className="text-sm font-bold text-primary">{calPct.toFixed(0)}%</span>
            </div>
            <div className="bg-secondary/30 dark:bg-white/5 p-8 rounded-[2.5rem] space-y-6 border border-border/50 dark:border-white/5 shadow-inner">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-5xl font-headline font-bold tracking-tighter text-foreground">{consumed}</span>
                  <span className="text-sm text-muted-foreground font-medium ml-2 opacity-60">/ {goal} kcal</span>
                </div>
                {calPct >= 100 && (
                  <div className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest animate-bounce">
                    <Flame className="w-3 h-3 fill-orange-500" /> ¡Meta!
                  </div>
                )}
              </div>
              <Progress value={calPct} className="h-4 bg-secondary/30 rounded-full" />
            </div>
          </section>

          <section className="space-y-6">
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-3 px-1">
              <Utensils className="w-3 h-3 text-accent" /> Diario de Comidas de Hoy
            </h3>
            {meals?.length === 0 ? (
              <div className="text-center py-16 bg-secondary/20 dark:bg-white/5 rounded-[2.5rem] opacity-30 border-dashed border-2 border-border/50">
                <p className="text-sm font-medium text-foreground">Aún no hay registros hoy.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5">
                {meals?.map(m => (
                  <Card key={m.id} className="bg-white dark:bg-white/5 border border-border/50 dark:border-none overflow-hidden hover:bg-secondary/10 dark:hover:bg-white/10 transition-all shadow-lg group rounded-[2rem]">
                    <div className="flex items-center">
                      <div className="w-32 h-32 sm:w-40 sm:h-40 bg-secondary/20 shrink-0 relative overflow-hidden">
                        {m.photoDataUri ? (
                          <img src={m.photoDataUri} alt={m.mealType} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-10">
                            <Utensils className="w-10 h-10 text-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                      <div className="p-6 flex-1 flex flex-col justify-between h-full min-w-0">
                        <div className="space-y-1">
                          <p className="font-bold text-xl leading-tight truncate text-foreground">{m.mealType}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest opacity-60">
                            {new Date(m.logDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                        <div className="flex justify-between items-center mt-6">
                          <span className="text-lg font-bold text-primary tracking-tight">{m.totalCalories} kcal</span>
                          <div className="flex gap-4 text-[10px] font-bold uppercase text-muted-foreground opacity-70">
                            <span>P:{m.totalProteins}g</span>
                            <span>C:{m.totalCarbohydrates}g</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </section>

          <div className="grid grid-cols-2 gap-5 pb-12">
             <Card className="bg-secondary/20 dark:bg-card/50 border-none p-6 space-y-2 shadow-inner rounded-[2rem]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Peso Actual</p>
                <p className="text-2xl font-bold tracking-tight text-foreground">{profile?.peso || '--'} kg</p>
             </Card>
             <Card className="bg-secondary/20 dark:bg-card/50 border-none p-6 space-y-2 shadow-inner rounded-[2rem]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">Actividad</p>
                <p className="text-2xl font-bold tracking-tight capitalize truncate text-foreground">{profile?.actividad?.replace('_', ' ')}</p>
             </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}