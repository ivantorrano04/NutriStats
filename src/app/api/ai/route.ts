import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { AdvisorInput, AdvisorOutput } from '@/ai/flows/nutritional-advisor'
import type { SuggestMealInput, SuggestMealOutput } from '@/ai/flows/meal-suggestion-flow'
import type { AnalyzeMealPhotoForNutrientsInput, AnalyzeMealPhotoForNutrientsOutput } from '@/ai/flows/analyze-meal-photo-for-nutrients'

import { getNutritionalAdvice } from '@/ai/flows/nutritional-advisor'
import { suggestMeal } from '@/ai/flows/meal-suggestion-flow'
import { analyzeMealPhotoForNutrients } from '@/ai/flows/analyze-meal-photo-for-nutrients'

type FlowRequest = {
  flow: 'advisor' | 'suggest' | 'analyze'
  input: any
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as FlowRequest;

    if (!body || !body.flow) {
      return NextResponse.json({ error: 'Missing flow' }, { status: 400 });
    }

    switch (body.flow) {
      case 'advisor': {
        const input = body.input as AdvisorInput;
        const result: AdvisorOutput = await getNutritionalAdvice(input);
        return NextResponse.json(result);
      }

      case 'suggest': {
        const input = body.input as SuggestMealInput;
        const result: SuggestMealOutput = await suggestMeal(input);
        return NextResponse.json(result);
      }

      case 'analyze': {
        const input = body.input as AnalyzeMealPhotoForNutrientsInput;
        const result: AnalyzeMealPhotoForNutrientsOutput = await analyzeMealPhotoForNutrients(input);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: 'Unknown flow' }, { status: 400 });
    }
  } catch (err: any) {
    console.error('AI route error', err);
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
