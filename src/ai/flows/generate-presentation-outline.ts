'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const PresentationOutlineInputSchema = z.object({
  question: z.string().optional(),
  answer: z.string().optional(),
  reasoning: z.string().optional(),
  topic: z.string().optional(),
});

const PresentationOutlineOutputSchema = z.object({
  outline: z.array(z.string()).describe('A list of topics and sub-topics for the presentation.'),
});

export async function generatePresentationOutline(input: z.infer<typeof PresentationOutlineInputSchema>): Promise<z.infer<typeof PresentationOutlineOutputSchema>> {
  return generatePresentationOutlineFlow(input);
}

const clinicalQuestionPrompt = ai.definePrompt({
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

const generalTopicPrompt = ai.definePrompt({
  name: 'generalTopicOutlinePrompt',
  input: { schema: z.object({ topic: z.string() }) },
  output: { schema: PresentationOutlineOutputSchema },
  prompt: `
    You are an expert in medical education. Your task is to generate a comprehensive presentation outline for the given medical topic, suitable for an audience of medical professionals (MBBS, PG, MD students in India).
    The outline should be structured logically, starting from the basics and progressing to advanced concepts. It must be detailed and cover the topic exhaustively.

    Medical Topic: {{topic}}

    Generate a JSON object with a single key "outline" containing an array of strings. The outline should include the following sections, where applicable:
    - Introduction / Overview of {{topic}}
    - Epidemiology and Risk Factors
    - Pathophysiology
    - Clinical Manifestations and Diagnosis
    - Diagnostic Workup (including relevant tests and imaging)
    - Treatment and Management (including pharmacological and non-pharmacological interventions)
    - Complications and Prognosis
    - Recent Advances and Future Directions
    - Case Studies / Clinical Scenarios
  `,
});

const generatePresentationOutlineFlow = ai.defineFlow(
  {
    name: 'generatePresentationOutlineFlow',
    inputSchema: PresentationOutlineInputSchema,
    outputSchema: PresentationOutlineOutputSchema,
  },
  async (input) => {
    if (input.topic) {
      const { output } = await generalTopicPrompt({ topic: input.topic });
      return output!;
    } else {
      const { output } = await clinicalQuestionPrompt(input);
      return output!;
    }
  }
);