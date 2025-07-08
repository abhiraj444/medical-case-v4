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
    You are an expert in medical education, tasked with creating a presentation outline for the medical topic: **{{topic}}**.
    The audience consists of postgraduate medical professionals in India (PG, MD), so the content must be advanced, in-depth, and clinically relevant.

    **Constraint Checklist & Output Format:**
    1.  **Max 15 Topics:** The final outline MUST contain a maximum of 15 topics.
    2.  **JSON Output:** The output MUST be a valid JSON object with a single key "outline" containing an array of strings (the topics).
    3.  **Content Structure:** The first 3-5 topics should cover intermediate-level concepts to establish a foundation. The remaining topics (up to 10) must be advanced, focusing on postgraduate-level knowledge, recent advances, and clinical practice.
    4.  **No Generalities:** Avoid basic or overly general topics. Focus on the complexities and nuances of the subject.

    **Example Outline Structure:**
    - Foundational Concepts (3-5 topics)
    - Advanced Topics (up to 10 topics)

    **Topic:** {{topic}}

    Generate the presentation outline now, adhering strictly to all constraints.
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