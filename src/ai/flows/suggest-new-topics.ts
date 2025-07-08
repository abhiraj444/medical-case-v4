'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const SuggestNewTopicsInputSchema = z.object({
  question: z.string(),
  existingTopics: z.array(z.string()),
});

const SuggestNewTopicsResponseSchema = z.object({
  topics: z.array(z.string()).describe('A list of new, technical medical topics related to the original question.'),
});

const prompt = ai.definePrompt({
  name: 'suggestNewTopicsPrompt',
  input: { schema: SuggestNewTopicsInputSchema },
  output: { schema: SuggestNewTopicsResponseSchema },
  prompt: `
    Based on the following clinical question, and excluding the existing topics, suggest a few new, highly technical medical topics for a presentation.

    Clinical Question: {{question}}
    Existing Topics: {{existingTopics}}

    Generate a JSON object with a single key "topics" containing an array of strings.
  `,
});

console.log('Prompt defined:', prompt);

export const suggestNewTopicsFlow = ai.defineFlow(
  {
    name: 'suggestNewTopicsFlow',
    inputSchema: SuggestNewTopicsInputSchema,
    outputSchema: SuggestNewTopicsResponseSchema,
  },
  async (input) => {
    console.log('Executing suggestNewTopicsFlow', input);
    const { output } = await prompt(input);
    console.log('LLM output:', output);
    return output!;
  }
);

console.log('Flow defined:', suggestNewTopicsFlow);