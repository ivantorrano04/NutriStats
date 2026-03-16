
"use client";

import { useEffect, useRef } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, onSnapshot, where, getDocs, Timestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { AppNotification, Friendship, MealRecord } from '@/lib/types';

/**
 * Escucha las notificaciones de Firestore y eventos del sistema en tiempo real.
 * Lanza notificaciones NATIVAS (estilo Push) para actividad de amigos y recordatorios.
 */
export function GlobalNotificationListener() {
  const { user } = useUser();
  const db = useFirestore();
  const { toast } = useToast();
  const lastProcessedTimeRef = useRef<number>(Date.now());
  const remindersSentRef = useRef<{ [key: string]: boolean }>({});

  // 1. Pedir permiso para notificaciones nativas al montar
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // 2. Listener para Notificaciones Generales (Invitaciones, Fuego, etc.)
  useEffect(() => {
    if (!user || !db) return;

    const q = query(
      collection(db, 'users', user.uid, 'notifications'),
      orderBy('createdAt', 'desc'),
      limit(1)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === "added") {
          const data = change.doc.data() as AppNotification;
          const createdAtTime = new Date(data.createdAt).getTime();

          if (createdAtTime > lastProcessedTimeRef.current && !data.read) {
            showNativeNotification(data.title, data.message);
            toast({ title: data.title, description: data.message });
          }
        }
      });
    });

    return () => unsubscribe();
  }, [user, db, toast]);

  // 3. Listener para Actividad de Amigos (Nuevas Comidas)
  useEffect(() => {
    if (!user || !db) return;

    // Buscamos amigos aceptados
    const friendsQuery = query(
      collection(db, 'users', user.uid, 'friendships'),
      where('status', '==', 'accepted')
    );

    const activeFriendListeners: { [key: string]: () => void } = {};

    const unsubscribeFriends = onSnapshot(friendsQuery, (snapshot) => {
      snapshot.docs.forEach((doc) => {
        const friend = doc.data() as Friendship;
        const friendId = friend.friendId;

        if (!activeFriendListeners[friendId]) {
          const today = new Date().toISOString().split('T')[0];
          const mealQuery = query(
            collection(db, 'users', friendId, 'mealLogs'),
            where('logDateTime', '>=', today),
            orderBy('logDateTime', 'desc'),
            limit(1)
          );

          // Escuchamos las comidas de cada amigo
          activeFriendListeners[friendId] = onSnapshot(mealQuery, (mealSnap) => {
            mealSnap.docChanges().forEach((change) => {
              if (change.type === "added") {
                const meal = change.doc.data() as MealRecord;
                const mealTime = new Date(meal.logDateTime).getTime();
                
                if (mealTime > lastProcessedTimeRef.current) {
                  const title = `¡${friend.friendName} ha comido! 📸`;
                  const message = `Acaba de registrar: ${meal.mealType} (${meal.totalCalories} kcal)`;
                  showNativeNotification(title, message);
                  toast({ title, description: message });
                }
              }
            });
          });
        }
      });
    });

    return () => {
      unsubscribeFriends();
      Object.values(activeFriendListeners).forEach(unsub => unsub());
    };
  }, [user, db, toast]);

  // 4. Timer para Recordatorios (14:30 y 21:00)
  useEffect(() => {
    if (!user || !db) return;

    const checkReminders = async () => {
      const now = new Date();
      const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const todayDate = now.toISOString().split('T')[0];

      // Definimos horas críticas
      const isLunchTime = timeStr === "14:30";
      const isDinnerTime = timeStr === "21:00";

      if ((isLunchTime || isDinnerTime) && !remindersSentRef.current[`${todayDate}-${timeStr}`]) {
        // Verificar si ya registró algo hoy
        const mealSnap = await getDocs(query(
          collection(db, 'users', user.uid, 'mealLogs'),
          where('logDateTime', '>=', todayDate)
        ));

        if (mealSnap.empty) {
          const title = isLunchTime ? "⏰ Hora del Almuerzo" : "⏰ Hora de la Cena";
          const message = "Aún no has registrado nada en NutriScan. ¡Saca una foto a tu plato!";
          showNativeNotification(title, message);
          toast({ title, description: message, variant: "destructive" });
        }
        
        remindersSentRef.current[`${todayDate}-${timeStr}`] = true;
      }
    };

    const interval = setInterval(checkReminders, 60000); // Revisar cada minuto
    return () => clearInterval(interval);
  }, [user, db, toast]);

  return null;
}

/**
 * Lanza una notificación nativa del sistema.
 */
function showNativeNotification(title: string, body: string) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(title, {
        body,
        icon: "https://picsum.photos/seed/nutriscan/128/128", // Placeholder icon
        badge: "https://picsum.photos/seed/nutriscan/128/128"
      });
    } catch (e) {
      console.error("Error al mostrar notificación nativa:", e);
    }
  }
}
