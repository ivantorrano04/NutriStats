
"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, writeBatch } from 'firebase/firestore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Bell, BellDot, CheckCheck, Inbox, Info, Sparkles, Trophy, AlertTriangle, Flame, Trash2, Clock, Users } from 'lucide-react';
import { AppNotification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';
import { useToast } from '@/hooks/use-toast';

export function NotificationCenter() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();

  const notificationsQuery = useMemoFirebase(() => user ? query(
    collection(db, 'users', user.uid, 'notifications'),
    orderBy('createdAt', 'desc'),
    limit(20)
  ) : null, [db, user]);

  const { data: notifications } = useCollection<AppNotification>(notificationsQuery);
  const unreadCount = notifications?.filter(n => !n.read).length || 0;

  const markAllAsRead = async () => {
    if (!user || !notifications) return;
    const unread = notifications.filter(n => !n.read);
    if (unread.length === 0) return;

    const batch = writeBatch(db);
    unread.forEach(n => {
      const ref = doc(db, 'users', user.uid, 'notifications', n.id);
      batch.update(ref, { read: true });
    });
    await batch.commit();
  };

  const clearAllNotifications = async () => {
    if (!user || !notifications || notifications.length === 0) return;
    
    const batch = writeBatch(db);
    notifications.forEach(n => {
      const ref = doc(db, 'users', user.uid, 'notifications', n.id);
      batch.delete(ref);
    });
    
    try {
      await batch.commit();
      toast({
        title: "Bandeja vacía",
        description: "Se han eliminado todas las notificaciones.",
      });
    } catch (e) {
      console.error("Error al limpiar notificaciones:", e);
    }
  };

  const markAsRead = (id: string) => {
    if (!user) return;
    updateDocumentNonBlocking(doc(db, 'users', user.uid, 'notifications', id), { read: true });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Trophy className="w-4 h-4 text-primary" />;
      case 'success': return <Sparkles className="w-4 h-4 text-emerald-500" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'praise': return <Flame className="w-4 h-4 text-orange-500" />;
      case 'friend_request': return <Users className="w-4 h-4 text-accent" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-2xl glass hover:bg-primary/10 ios-btn">
          {unreadCount > 0 ? (
            <>
              <BellDot className="w-5 h-5 text-primary animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-white ring-2 ring-background">
                {unreadCount}
              </span>
            </>
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="glass border-l border-white/10 sm:max-w-md p-0 [&>button]:hidden rounded-l-[3rem] overflow-hidden shadow-2xl">
        <SheetHeader className="p-8 pb-4 bg-background/50 backdrop-blur-3xl sticky top-0 z-20 border-b border-white/5">
          <div className="flex items-center justify-between w-full">
            <SheetTitle className="text-2xl font-headline font-bold flex items-center gap-2">
              Notificaciones
              {unreadCount > 0 && <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded-full">{unreadCount}</span>}
            </SheetTitle>
            <div className="flex gap-1.5">
              {unreadCount > 0 && (
                <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-[9px] font-bold text-primary hover:bg-primary/10 h-8 rounded-xl px-2.5 ios-btn">
                  <CheckCheck className="w-3 h-3 mr-1.5" /> Leer
                </Button>
              )}
              {notifications && notifications.length > 0 && (
                <Button variant="ghost" size="sm" onClick={clearAllNotifications} className="text-[9px] font-bold text-destructive hover:bg-destructive/10 h-8 rounded-xl px-2.5 ios-btn">
                  <Trash2 className="w-3 h-3 mr-1.5" /> Limpiar
                </Button>
              )}
            </div>
          </div>
        </SheetHeader>

        <div className="px-6 py-4 space-y-4 overflow-y-auto max-h-[calc(100vh-120px)]">
          {notifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 opacity-40">
              <div className="w-20 h-20 rounded-full bg-secondary/30 flex items-center justify-center">
                <Inbox className="w-8 h-8 text-muted-foreground" />
              </div>
              <div className="space-y-1 px-8">
                <p className="font-bold text-lg">Todo en orden</p>
                <p className="text-[10px] font-medium leading-tight">No tienes notificaciones pendientes por ahora.</p>
              </div>
            </div>
          ) : (
            notifications?.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={cn(
                  "p-5 rounded-[1.8rem] transition-all cursor-pointer border relative group ios-btn",
                  n.read 
                    ? "bg-secondary/10 border-transparent opacity-50" 
                    : "glass border-primary/20 shadow-xl shadow-primary/5"
                )}
              >
                {!n.read && <div className="absolute top-5 right-5 w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_10px_rgba(59,130,246,0.6)]" />}
                <div className="flex gap-4">
                  <div className={cn(
                    "w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 shadow-inner",
                    n.read ? "bg-secondary/20" : "bg-primary/10"
                  )}>
                    {getIcon(n.type)}
                  </div>
                  <div className="space-y-1 flex-1 min-w-0">
                    <h4 className={cn("text-sm font-bold truncate", !n.read && "text-primary")}>{n.title}</h4>
                    <p className="text-[11px] text-muted-foreground leading-snug font-medium">{n.message}</p>
                    <div className="flex items-center gap-1.5 pt-2 opacity-50">
                      <Clock className="w-3 h-3" />
                      <p className="text-[9px] font-bold uppercase tracking-wider">
                        {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
