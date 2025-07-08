'use server';

import { NextResponse } from 'next/server';
import { generatePresentationOutline } from '@/ai/flows/generate-presentation-outline';
import { generateSlideContent } from '@/ai/flows/generate-slide-content';
import { suggestNewTopicsFlow } from '@/ai/flows/suggest-new-topics';
import { modifySlides } from '@/ai/flows/modify-slides';
import { generateSingleSlideFlow } from '@/ai/flows/generate-single-slide';

export async function POST(request: Request) {
  const { action, payload } = await request.json();

  try {
    if (action === 'generateOutline') {
      const result = await generatePresentationOutline(payload);
      return NextResponse.json(result);
    } else if (action === 'generateSlides') {
      const result = await generateSlideContent(payload);
      return NextResponse.json(result);
    } else if (action === 'suggestTopics') {
      const result = await suggestNewTopicsFlow(payload);
      return NextResponse.json(result);
    } else if (action === 'modifySlides') {
      const result = await modifySlides(payload);
      return NextResponse.json(result);
    } else if (action === 'generateSingleSlide') {
      const result = await generateSingleSlideFlow(payload);
      return NextResponse.json(result);
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error(`Error in content-generator API: ${error.message}`);
    return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
  }
}