
export type ActivityLevel = 'sedentario' | 'ligero' | 'moderado' | 'activo' | 'muy_activo';
export type Goal = 'perder_grasa' | 'mantenimiento' | 'ganar_musculo';
export type Gender = 'hombre' | 'mujer';
export type Intensity = 'saludable' | 'moderado' | 'intenso';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  peso: number;
  targetWeight?: number;
  altura: number;
  edad: number;
  genero: Gender;
  actividad: ActivityLevel;
  objetivo: Goal;
  intensity: Intensity;
  calorieGoal: number;
  proteinGoalGrams: number;
  carbohydrateGoalGrams: number;
  fatGoalGrams: number;
  metaAguaMl: number;
  createdAt: string;
  updatedAt?: string;
}

export interface MealRecord {
  id: string;
  userId: string;
  logDateTime: string; // ISO String
  mealType: string;
  totalCalories: number;
  totalProteins: number;
  totalCarbohydrates: number;
  totalFats: number;
  photoDataUri?: string;
  analysisRaw: string;
}

export interface WeightLog {
  id: string;
  userId: string;
  logDate: string;
  weightKg: number;
  createdAt: string;
}

export interface AppNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'goal' | 'friend_request' | 'praise';
  read: boolean;
  createdAt: string;
}

export interface Friendship {
  id: string;
  friendId: string;
  friendName: string;
  status: 'pending_sent' | 'pending_received' | 'accepted';
  updatedAt: string;
}
