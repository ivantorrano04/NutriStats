'use server';
/**
 * @fileOverview A Genkit flow for analyzing a meal photo to estimate its nutritional content.
 *
 * - analyzeMealPhotoForNutrients - A function that handles the meal photo analysis process.
 * - AnalyzeMealPhotoForNutrientsInput - The input type for the analyzeMealPhotoForNutrients function.
 * - AnalyzeMealPhotoForNutrientsOutput - The return type for the analyzeMealPhotoForNutrients function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Input Schema
const AnalyzeMealPhotoForNutrientsInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a meal, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  mealDescription: z
    .string()
    .optional()
    .describe('An optional description of the meal, to aid in analysis.'),
});
export type AnalyzeMealPhotoForNutrientsInput = z.infer<typeof AnalyzeMealPhotoForNutrientsInputSchema>;

// Output Schema for the prompt (AI's direct response, without the raw stringified version)
const AnalyzeMealPhotoNutritionalOutputSchema = z.object({
  calories: z.number().describe('Estimated total calories in kcal.'),
  protein: z.number().describe('Estimated total protein in grams.'),
  carbohydrates: z.number().describe('Estimated total carbohydrates in grams.'),
  fats: z.number().describe('Estimated total fats in grams.'),
});
type AnalyzeMealPhotoNutritionalOutput = z.infer<typeof AnalyzeMealPhotoNutritionalOutputSchema>;

// Final Output Schema for the flow (includes raw AI response for persistence)
const AnalyzeMealPhotoForNutrientsOutputSchema = AnalyzeMealPhotoNutritionalOutputSchema.extend({
    analysisRaw: z.string().describe('The complete JSON string representation of the AI-parsed nutritional data.'),
});
export type AnalyzeMealPhotoForNutrientsOutput = z.infer<typeof AnalyzeMealPhotoForNutrientsOutputSchema>;

const analyzeMealPhotoPrompt = ai.definePrompt({
  name: 'analyzeMealPhotoPrompt',
  input: {schema: AnalyzeMealPhotoForNutrientsInputSchema},
  output: {schema: AnalyzeMealPhotoNutritionalOutputSchema},
  prompt: `You are an expert nutritionist AI. Your task is to analyze food items from an image and provide their estimated nutritional content.
Identify the main food items in the image and estimate their calories, protein, carbohydrates, and fats in grams.
If a meal description is provided, use it to aid your analysis.

Return the nutritional information in a JSON object with the following structure. Do not include any other text.
\`\`\`json
{
  "calories": <estimated_total_calories_in_kcal_as_number>,
  "protein": <estimated_total_protein_in_grams_as_number>,
  "carbohydrates": <estimated_total_carbohydrates_in_grams_as_number>,
  "fats": <estimated_total_fats_in_grams_as_number>
}
\`\`\`

Make sure the numbers are rounded to one decimal place if necessary.
Be as accurate as possible, but provide estimates if exact values are impossible to determine from the image alone.
If you cannot identify food or estimate nutrients, return zeros for all nutritional values.

Image: {{media url=photoDataUri}}
{{#if mealDescription}}
Description: {{{mealDescription}}}
{{/if}}`,
});

const analyzeMealPhotoForNutrientsFlow = ai.defineFlow(
  {
    name: 'analyzeMealPhotoForNutrientsFlow',
    inputSchema: AnalyzeMealPhotoForNutrientsInputSchema,
    outputSchema: AnalyzeMealPhotoForNutrientsOutputSchema,
  },
  async (input) => {
    // Call the prompt. The AI is expected to return JSON matching AnalyzeMealPhotoNutritionalOutputSchema.
    const { output } = await analyzeMealPhotoPrompt(input);

    // If output is null or undefined, handle gracefully.
    if (!output) {
      throw new Error('AI analysis failed to produce nutritional data or could not parse the response.');
    }

    // Construct the final output, including the stringified raw AI response.
    const finalOutput: AnalyzeMealPhotoForNutrientsOutput = {
      calories: output.calories,
      protein: output.protein,
      carbohydrates: output.carbohydrates,
      fats: output.fats,
      analysisRaw: JSON.stringify(output), // Store the stringified version of what the AI returned and Genkit parsed
    };

    return finalOutput;
  }
);

export async function analyzeMealPhotoForNutrients(input: AnalyzeMealPhotoForNutrientsInput): Promise<AnalyzeMealPhotoForNutrientsOutput> {
  return analyzeMealPhotoForNutrientsFlow(input);
}
