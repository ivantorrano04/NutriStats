"use client";

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, where, doc, getDoc, writeBatch, orderBy, addDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, UserPlus, Check, X, Users, Activity, Utensils, ChevronRight, Flame, Clock } from 'lucide-react';
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
    <div className="min-h-screen bg-transparent pb-48 safe-area-pt">
      <main className="max-w-xl mx-auto px-6 pt-6 space-y-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-headline font-bold text-foreground tracking-tight">Comunidad</h1>
          <p className="text-muted-foreground text-xs font-medium opacity-70">Conecta y celebra el progreso</p>
        </header>

        <Card className="glass border-none shadow-xl rounded-[2.2rem]">
          <CardContent className="p-5 space-y-4">
            <div className="space-y-1.5 px-1">
              <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">Tu ID NutriScan</p>
              <div className="flex gap-2">
                <code className="bg-secondary/50 p-2.5 rounded-xl flex-1 font-mono text-[10px] truncate text-foreground border border-white/5">{user?.uid}</code>
                <Button variant="secondary" size="sm" className="rounded-xl ios-btn h-9" onClick={() => { navigator.clipboard.writeText(user?.uid || ''); toast({ title: 'ID Copiado' }); }}>Copiar</Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Input 
                placeholder="Pega el ID de tu amigo..." 
                className="glass rounded-xl text-foreground text-xs h-10 px-4" 
                value={searchId}
                onChange={e => setSearchId(e.target.value)}
              />
              <Button onClick={sendRequest} disabled={searching || !searchId} className="rounded-xl bg-primary h-10 ios-btn text-xs px-4">
                {searching ? <Loader2 className="animate-spin h-4 w-4" /> : <UserPlus className="w-4 h-4 mr-2" />}
                Invitar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2 glass p-1 rounded-2xl h-11">
            <TabsTrigger value="friends" className="rounded-xl font-bold text-[11px]">Amigos ({acceptedFriends.length})</TabsTrigger>
            <TabsTrigger value="pending" className="rounded-xl font-bold text-[11px]">Solicitudes ({pendingReceived.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="pt-4 space-y-3">
            {acceptedFriends.length === 0 ? (
              <div className="text-center py-16 glass rounded-[2.5rem] border-dashed border-border opacity-40">
                <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground" />
                <p className="text-sm font-medium">¡Invita a tu primer amigo!</p>
              </div>
            ) : (
              acceptedFriends.map(f => (
                <div key={f.friendId} className="glass p-3 rounded-[1.8rem] flex justify-between items-center ios-btn hover:bg-white/5 transition-colors border-white/5" onClick={() => setSelectedFriend(f.friendId)}>
                  <div className="flex items-center gap-4">
                    <div className="w-11 h-11 rounded-2xl bg-primary flex items-center justify-center font-bold text-white text-lg shadow-lg">
                      {f.friendName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{f.friendName}</p>
                      <p className="text-[9px] text-accent font-bold uppercase tracking-wider opacity-70">Ver actividad</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-40" />
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="pending" className="pt-4 space-y-3">
            {pendingReceived.length === 0 ? (
              <div className="text-center py-16 opacity-30">
                <p className="text-xs font-medium">Sin solicitudes pendientes.</p>
              </div>
            ) : (
              pendingReceived.map(f => (
                <div key={f.friendId} className="glass p-3 rounded-[1.8rem] flex justify-between items-center border-white/5">
                  <div className="flex items-center gap-3">
                     <div className="w-9 h-9 rounded-2xl bg-secondary flex items-center justify-center font-bold text-xs text-foreground">{f.friendName.charAt(0)}</div>
                     <p className="font-bold text-sm text-foreground">{f.friendName}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="icon" className="bg-emerald-500 hover:bg-emerald-600 h-9 w-9 rounded-xl ios-btn text-white" onClick={() => respondRequest(f.friendId, true)}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="destructive" className="h-9 w-9 rounded-xl ios-btn" onClick={() => respondRequest(f.friendId, false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
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
      toast({ title: '¡Reacción enviada! 🔥' });
    } catch (e) {
      console.error(e);
    } finally {
      setReacting(false);
    }
  };

  return (
    <Dialog open={!!friendId} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="glass border-none max-w-sm max-h-[85vh] overflow-y-auto p-0 rounded-[3rem] shadow-2xl [&>button]:hidden">
        <DialogHeader className="p-6 bg-background/50 backdrop-blur-3xl sticky top-0 z-20 border-b border-white/5">
          <div className="flex items-center justify-between w-full">
            <DialogTitle className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center font-bold text-white text-xl shadow-lg">
                {profile?.name?.charAt(0)}
              </div>
              <div className="text-left">
                <p className="font-bold text-lg text-foreground truncate max-w-[140px]">{profile?.name}</p>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-60 flex items-center gap-1">
                   Meta: {profile?.objetivo?.replace('_', ' ')}
                </p>
              </div>
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button 
                size="icon" 
                variant="secondary" 
                className="rounded-2xl h-10 w-10 bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/10 ios-btn"
                onClick={handleSendFire}
                disabled={reacting}
              >
                {reacting ? <Loader2 className="animate-spin w-4 h-4" /> : <Flame className="w-5 h-5 fill-orange-500" />}
              </Button>
              <DialogClose asChild>
                <Button variant="ghost" size="icon" className="rounded-2xl h-10 w-10 hover:bg-secondary ios-btn">
                  <X className="w-5 h-5 text-foreground" />
                </Button>
              </DialogClose>
            </div>
          </div>
        </DialogHeader>
        
        <div className="p-6 space-y-8">
          <section className="space-y-4">
            <div className="flex justify-between items-end px-1">
              <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground opacity-60">Consumo Hoy</p>
              <span className="text-[10px] font-bold text-primary">{calPct.toFixed(0)}%</span>
            </div>
            <div className="glass p-6 rounded-[2rem] space-y-4 border-white/5 shadow-inner">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-4xl font-headline font-bold text-foreground tracking-tighter">{consumed}</span>
                  <span className="text-[10px] text-muted-foreground font-medium ml-1.5 opacity-40">/ {goal} kcal</span>
                </div>
                {calPct >= 100 && (
                  <div className="bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest animate-pulse">
                    ¡Meta!
                  </div>
                )}
              </div>
              <Progress value={calPct} className="h-2.5 bg-secondary/30 rounded-full" />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2 px-1">
              <Utensils className="w-3 h-3 text-accent" /> Diario de hoy
            </h3>
            {meals?.length === 0 ? (
              <div className="text-center py-10 glass rounded-[2rem] opacity-30 border-dashed border border-border">
                <p className="text-xs font-medium">Sin registros hoy.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {meals?.map(m => (
                  <Card key={m.id} className="glass border-none overflow-hidden hover:bg-white/5 transition-all border-white/5 rounded-[1.8rem]">
                    <div className="flex items-center">
                      <div className="w-20 h-20 bg-secondary/30 shrink-0 relative overflow-hidden">
                        {m.photoDataUri ? (
                          <img src={m.photoDataUri} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-10">
                            <Utensils className="w-6 h-6" />
                          </div>
                        )}
                      </div>
                      <div className="p-4 flex-1 min-w-0">
                        <div className="flex justify-between items-start mb-1">
                           <p className="font-bold text-sm text-foreground truncate">{m.mealType}</p>
                           <span className="text-[8px] font-bold opacity-30 flex items-center gap-0.5"><Clock className="w-2 h-2" /> {new Date(m.logDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <div className="flex justify-between items-center mt-2">
                          <span className="text-xs font-bold text-primary">{m.totalCalories} <span className="text-[8px] opacity-50">kcal</span></span>
                          <div className="flex gap-2 text-[8px] font-bold uppercase opacity-50">
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

          <div className="grid grid-cols-2 gap-3 pb-8">
             <div className="glass p-4 space-y-1 rounded-[1.5rem] border-white/5 text-center">
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">Peso</p>
                <p className="text-lg font-bold text-foreground">{profile?.peso || '--'} <span className="text-[9px] opacity-40">kg</span></p>
             </div>
             <div className="glass p-4 space-y-1 rounded-[1.5rem] border-white/5 text-center">
                <p className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground opacity-50">Actividad</p>
                <p className="text-[11px] font-bold text-foreground truncate capitalize">{profile?.actividad?.replace('_', ' ')}</p>
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}