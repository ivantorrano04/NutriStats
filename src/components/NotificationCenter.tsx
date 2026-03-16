"use client";

import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, writeBatch } from 'firebase/firestore';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Bell, BellDot, CheckCheck, Inbox, Info, Sparkles, Trophy, AlertTriangle, Flame } from 'lucide-react';
import { AppNotification } from '@/lib/types';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { updateDocumentNonBlocking } from '@/firebase/non-blocking-updates';

export function NotificationCenter() {
  const { user } = useUser();
  const db = useFirestore();

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

  const markAsRead = (id: string) => {
    if (!user) return;
    updateDocumentNonBlocking(doc(db, 'users', user.uid, 'notifications', id), { read: true });
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'goal': return <Trophy className="w-4 h-4 text-primary" />;
      case 'success': return <Sparkles className="w-4 h-4 text-accent" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'praise': return <Flame className="w-4 h-4 text-orange-500" />;
      default: return <Info className="w-4 h-4 text-muted-foreground" />;
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative rounded-2xl glass hover:bg-primary/10">
          {unreadCount > 0 ? (
            <>
              <BellDot className="w-5 h-5 text-primary animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white ring-2 ring-background">
                {unreadCount}
              </span>
            </>
          ) : (
            <Bell className="w-5 h-5 text-muted-foreground" />
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="glass border-l border-border/50 sm:max-w-md">
        <SheetHeader className="flex flex-row items-center justify-between pb-6 space-y-0">
          <SheetTitle className="text-2xl font-headline font-bold">Notificaciones</SheetTitle>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="text-xs text-primary hover:text-primary/80">
              <CheckCheck className="w-3 h-3 mr-1" /> Leer todas
            </Button>
          )}
        </SheetHeader>

        <div className="space-y-4 overflow-y-auto max-h-[calc(100vh-120px)] pr-2">
          {notifications?.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4 opacity-50">
              <Inbox className="w-12 h-12 text-muted-foreground" />
              <div className="space-y-1">
                <p className="font-bold">Todo al día</p>
                <p className="text-xs">No tienes notificaciones pendientes.</p>
              </div>
            </div>
          ) : (
            notifications?.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.read && markAsRead(n.id)}
                className={cn(
                  "p-4 rounded-3xl transition-all cursor-pointer border relative group",
                  n.read ? "bg-transparent border-transparent opacity-60" : "glass border-primary/20 shadow-lg"
                )}
              >
                {!n.read && <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-primary" />}
                <div className="flex gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                    n.read ? "bg-secondary" : "bg-primary/10"
                  )}>
                    {getIcon(n.type)}
                  </div>
                  <div className="space-y-1">
                    <h4 className={cn("text-sm font-bold", !n.read && "text-primary")}>{n.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground pt-1 font-medium">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true, locale: es })}
                    </p>
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
