'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PresentationOutlineInputSchema = z.object({
  question: z.string(),
  answer: z.string(),
  reasoning: z.string(),
});

const PresentationOutlineOutputSchema = z.object({
  outline: z.array(z.string()).describe('A list of topics and sub-topics for the presentation.'),
});

export async function generatePresentationOutline(input: z.infer<typeof PresentationOutlineInputSchema>): Promise<z.infer<typeof PresentationOutlineOutputSchema>> {
  return generatePresentationOutlineFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePresentationOutlinePrompt',
  input: { schema: PresentationOutlineInputSchema },
  output: { schema: PresentationOutlineOutputSchema },
  prompt: `
    Based on the following clinical question, answer, and reasoning, generate a structured outline for a medical presentation.
    The outline should consist of a list of topics and sub-topics.
    The VERY FIRST topic in the outline MUST be "Clinical Question, Answer, and Analysis Summary".
    Subsequent topics should be technical and appropriate for a medical audience, directly related to the clinical case presented in the question, answer, and reasoning.

    Question: {{question}}
    Answer: {{answer}}
    Reasoning: {{reasoning}}

    Generate a JSON object with a single key "outline" containing an array of strings.
  `,
});

const generatePresentationOutlineFlow = ai.defineFlow(
  {
    name: 'generatePresentationOutlineFlow',
    inputSchema: PresentationOutlineInputSchema,
    outputSchema: PresentationOutlineOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);