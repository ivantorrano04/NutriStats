'use server';
/**
 * @fileOverview Un generador de recetas táctico que optimiza tus macros restantes.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestMealInputSchema = z.object({
  remainingCal: z.number(),
  remainingProt: z.number(),
  remainingCarb: z.number(),
  remainingFat: z.number(),
  preferencias: z.string().optional(),
});

const SuggestMealOutputSchema = z.object({
  nombrePlato: z.string().describe('Un nombre creativo para la receta.'),
  descripcion: z.string().describe('Por qué este plato es perfecto para tus macros actuales.'),
  ingredientes: z.array(z.string()).describe('Lista de ingredientes necesarios.'),
  instrucciones: z.array(z.string()).describe('Pasos cortos de preparación.'),
  macrosEstimados: z.object({
    cal: z.number(),
    prot: z.number(),
    carb: z.number(),
    fat: z.number(),
  }),
});

export type SuggestMealInput = z.infer<typeof SuggestMealInputSchema>;
export type SuggestMealOutput = z.infer<typeof SuggestMealOutputSchema>;

const suggestMealPrompt = ai.definePrompt({
  name: 'suggestMealPrompt',
  input: { schema: SuggestMealInputSchema },
  output: { schema: SuggestMealOutputSchema },
  prompt: `Eres un Chef de Rendimiento y Nutricionista. Tu objetivo es sugerir una comida que ayude al usuario a completar sus objetivos diarios de nutrición.

Macros faltantes para hoy:
- Calorías: {{{remainingCal}}} kcal
- Proteína: {{{remainingProt}}} g
- Carbohidratos: {{{remainingCarb}}} g
- Grasas: {{{remainingFat}}} g

{{#if preferencias}}Preferencias del usuario: {{{preferencias}}}{{/if}}

Instrucciones:
1. Diseña una receta que se ajuste lo más posible a estos macros faltantes (sin pasarse).
2. Prioriza alimentos reales y fáciles de preparar.
3. El tono debe ser profesional y motivador.
4. Genera la respuesta en formato JSON estructurado.`,
});

const suggestMealFlow = ai.defineFlow(
  {
    name: 'suggestMealFlow',
    inputSchema: SuggestMealInputSchema,
    outputSchema: SuggestMealOutputSchema,
  },
  async (input) => {
    const { output } = await suggestMealPrompt(input);
    if (!output) throw new Error('No se pudo generar la sugerencia de comida.');
    return output;
  }
);

export async function suggestMeal(input: SuggestMealInput): Promise<SuggestMealOutput> {
  return suggestMealFlow(input);
}
