"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile, MealRecord, ActivityLevel, Goal, Gender } from './types';

interface AppContextType {
  user: UserProfile | null;
  meals: MealRecord[];
  loading: boolean;
  setUser: (user: UserProfile) => void;
  addMeal: (meal: MealRecord) => void;
  updateMeal: (meal: MealRecord) => void;
  deleteMeal: (id: string) => void;
  calculateTMB: (user: Partial<UserProfile>) => number;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<UserProfile | null>(null);
  const [meals, setMeals] = useState<MealRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('nutriscan_user');
    const savedMeals = localStorage.getItem('nutriscan_meals');
    if (savedUser) setUserState(JSON.parse(savedUser));
    if (savedMeals) setMeals(JSON.parse(savedMeals));
    setLoading(false);
  }, []);

  const setUser = (newUser: UserProfile) => {
    setUserState(newUser);
    localStorage.setItem('nutriscan_user', JSON.stringify(newUser));
  };

  const addMeal = (meal: MealRecord) => {
    const updated = [meal, ...meals];
    setMeals(updated);
    localStorage.setItem('nutriscan_meals', JSON.stringify(updated));
  };

  const updateMeal = (updatedMeal: MealRecord) => {
    const updated = meals.map(m => m.id === updatedMeal.id ? updatedMeal : m);
    setMeals(updated);
    localStorage.setItem('nutriscan_meals', JSON.stringify(updated));
  };

  const deleteMeal = (id: string) => {
    const updated = meals.filter(m => m.id !== id);
    setMeals(updated);
    localStorage.setItem('nutriscan_meals', JSON.stringify(updated));
  };

  const calculateTMB = (u: Partial<UserProfile>) => {
    if (!u.peso || !u.altura || !u.edad || !u.genero) return 0;
    
    // Mifflin-St Jeor Equation
    let baseTMB = 10 * u.peso + 6.25 * u.altura - 5 * u.edad;
    if (u.genero === 'hombre') baseTMB += 5;
    else baseTMB -= 161;

    const activityFactors: Record<ActivityLevel, number> = {
      sedentario: 1.2,
      ligero: 1.375,
      moderado: 1.55,
      activo: 1.725,
      muy_activo: 1.9,
    };

    const multiplier = activityFactors[u.actividad || 'sedentario'];
    const totalDailyEnergyExpenditure = baseTMB * multiplier;

    if (u.objetivo === 'perder_grasa') return Math.round(totalDailyEnergyExpenditure - 500);
    if (u.objetivo === 'ganar_musculo') return Math.round(totalDailyEnergyExpenditure + 500);
    return Math.round(totalDailyEnergyExpenditure);
  };

  return (
    <AppContext.Provider value={{ user, meals, loading, setUser, addMeal, updateMeal, deleteMeal, calculateTMB }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
