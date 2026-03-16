import { config } from 'dotenv';
config();

import '@/ai/flows/analyze-meal-photo-for-nutrients.ts';
import '@/ai/flows/nutritional-advisor.ts';
import '@/ai/flows/meal-suggestion-flow.ts';
