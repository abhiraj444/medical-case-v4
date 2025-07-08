import { suggestNewTopicsFlow } from '@/ai/flows/suggest-new-topics';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { question, topic, existingTopics } = await req.json();

    if (!question && !topic) {
      return NextResponse.json({ error: 'Missing question or topic context to generate new topics.' }, { status: 400 });
    }

    const result = await suggestNewTopicsFlow({
      question: question || undefined,
      topic: topic || undefined,
      existingTopics: existingTopics || [],
    });

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error suggesting new topics:', error);
    return NextResponse.json({ error: error.message || 'Failed to suggest new topics.' }, { status: 500 });
  }
}
