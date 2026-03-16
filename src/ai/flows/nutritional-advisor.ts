'use server';
/**
 * @fileOverview Un asesor nutricional de élite impulsado por IA.
 * 
 * - getNutritionalAdvice - Analiza el progreso diario y genera consejos estratégicos.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AdvisorInputSchema = z.object({
  nombre: z.string(),
  objetivo: z.string().describe('perder_grasa, mantenimiento o ganar_musculo'),
  consumo: z.object({
    cal: z.number(),
    prot: z.number(),
    carb: z.number(),
    fat: z.number(),
  }),
  metas: z.object({
    cal: z.number(),
    prot: z.number(),
    carb: z.number(),
    fat: z.number(),
  }),
  peso: z.number(),
});

const AdvisorOutputSchema = z.object({
  consejo: z.string().describe('Un párrafo corto y motivador con consejos estratégicos.'),
  estado: z.enum(['excelente', 'en_progreso', 'ajuste_necesario']).describe('Estado actual del día.'),
  sugerenciaComida: z.string().describe('Qué tipo de alimento priorizar ahora.'),
});

export type AdvisorInput = z.infer<typeof AdvisorInputSchema>;
export type AdvisorOutput = z.infer<typeof AdvisorOutputSchema>;

const advisorPrompt = ai.definePrompt({
  name: 'advisorPrompt',
  input: { schema: AdvisorInputSchema },
  output: { schema: AdvisorOutputSchema },
  prompt: `Eres un nutricionista de élite y coach de biohacking. Analiza el progreso diario de {{{nombre}}}.

Contexto:
- Objetivo: {{{objetivo}}}
- Peso actual: {{{peso}}} kg
- Consumo actual: {{{consumo.cal}}}kcal (P:{{{consumo.prot}}}g, C:{{{consumo.carb}}}g, G:{{{consumo.fat}}}g)
- Metas diarias: {{{metas.cal}}}kcal (P:{{{metas.prot}}}g, C:{{{metas.carb}}}g, G:{{{metas.fat}}}g)

Instrucciones:
1. Evalúa si el balance de macros es óptimo para su objetivo (perder_grasa, mantenimiento o ganar_musculo).
2. Si el objetivo es perder_grasa, prioriza saciedad y proteínas.
3. Si el objetivo es ganar_musculo, asegura suficiente proteína y superávit controlado.
4. Mantén un tono profesional, motivador y directo.

Genera una respuesta estratégica en JSON.`,
});

export async function getNutritionalAdvice(input: AdvisorInput): Promise<AdvisorOutput> {
  const { output } = await advisorPrompt(input);
  if (!output) throw new Error('No se pudo generar el consejo.');
  return output;
}
