'use server';
/**
 * @fileOverview Modifies an existing slide deck based on user actions, using a structured JSON format.
 *
 * - modifySlides - A function that handles slide modification.
 * - ModifySlidesInput - The input type for the modifySlides function.
 * - ModifySlidesOutput - The return type for the modifySlides function.
 */
import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Slide } from '@/types';

// Schemas for structured content
const ParagraphSchema = z.object({
  type: z.enum(['paragraph']),
  text: z.string(),
  bold: z.array(z.string()).optional(),
});

const ListItemSchema = z.object({
  text: z.string().describe('The text for a single list item.'),
  bold: z.array(z.string()).optional().describe('An array of substrings from the text to be bolded.'),
});

const BulletListSchema = z.object({
  type: z.enum(['bullet_list']),
  items: z.array(ListItemSchema),
});

const NumberedListSchema = z.object({
  type: z.enum(['numbered_list']),
  items: z.array(ListItemSchema),
});

const NoteSchema = z.object({
  type: z.enum(['note']),
  text: z.string(),
});

const TableRowSchema = z.object({
  cells: z.array(z.string()),
});

const TableSchema = z.object({
  type: z.enum(['table']),
  headers: z.array(z.string()),
  rows: z.array(TableRowSchema),
});

const ContentItemSchema = z.union([
  ParagraphSchema,
  BulletListSchema,
  NumberedListSchema,
  NoteSchema,
  TableSchema,
]);

const SlideSchema = z.object({
  title: z.string().describe('The title for a single slide.'),
  content: z.array(ContentItemSchema).describe('An array of structured content items for the slide body.'),
});

const ModifySlidesInputSchema = z.object({
  slides: z.array(SlideSchema).describe('The current array of slide objects in structured JSON format.').optional(),
  selectedIndices: z.array(z.number()).describe('The indices of the slides to be modified.').optional(),
  action: z.enum(['expand_content', 'replace_content', 'expand_selected', 'add_slide']).describe('The modification action to perform.'),
  customTopic: z.string().optional().describe('A custom topic for a new slide when action is add_slide.'),
});
export type ModifySlidesInput = z.infer<typeof ModifySlidesInputSchema>;

const ModifySlidesOutputSchema = z.array(SlideSchema);
export type ModifySlidesOutput = z.infer<typeof ModifySlidesOutputSchema>;


export async function modifySlides(input: ModifySlidesInput): Promise<ModifySlidesOutput> {
  const result = await modifySlidesFlow(input) as Slide[];
  return result;
}

const modifySlidesPrompt = ai.definePrompt({
  name: 'modifySlidesPrompt',
  input: {schema: ModifySlidesInputSchema},
  output: {schema: ModifySlidesOutputSchema},
  prompt: `You are an AI assistant for creating medical presentations. You will be given an array of presentation slides in a structured JSON format, the indices of selected slides, and an action to perform. Your task is to modify the slides and return the complete, updated array of all slides in the same JSON format.\n\nACTION: {{{action}}}\n\n{{#if slides}}\nCURRENT SLIDES (JSON):\n{{{json slides}}}\n{{/if}}\n\n{{#if selectedIndices}}\nSELECTED SLIDE INDICES:\n{{{json selectedIndices}}}\n{{/if}}\n\n{{#if customTopic}}\nCUSTOM TOPIC: {{{customTopic}}}\n{{/if}}\n\nINSTRUCTIONS:\n- Your response MUST be a complete array of all slides (modified and unmodified) in the correct order, conforming to the JSON schema.\n- **CRITICAL**: Break down complex topics into many small, distinct points. Use \`bullet_list\` or \`numbered_list\` extensively. Each item in a list should be concise. Avoid long paragraphs. Aim for 6-8 distinct points per slide.\n- **Bolding**: For "paragraph" and list "items", use the \`bold\` array to specify substrings of the \`text\` that should be bolded. **Do NOT use markdown like \`**text**\` inside any text fields.**\n- If the action is 'expand_content':\n  - Take the topics from the selected slides.\n  - Generate more detailed content for these topics. This may result in creating MORE slides than were originally selected.\n  - Replace the selected slides in the original array with the new, expanded slides you generate.\n- If the action is 'replace_content':\n  - Generate alternative content for the selected slides, keeping the same topics and titles.\n  - The number of slides returned should be the same as the number of selected slides.\n- If the action is 'expand_selected':\n  - Add more in-depth technical explanations and details to the \'content\' of the selected slides.\n  - Do NOT change the slide titles or add new slides. Just enrich the \'content\' array of the existing selected slides.\n- If the action is 'add_slide':\n  - Generate a single new slide based on the CUSTOM TOPIC provided.\n  - The new slide should be technically rich and detailed.\n  - Return ONLY the new slide as a single-element array.\n`,
});

const modifySlidesFlow = ai.defineFlow(
  {
    name: 'modifySlidesFlow',
    inputSchema: ModifySlidesInputSchema,
    outputSchema: ModifySlidesOutputSchema,
  },
  async (input) => {
    const {output} = await modifySlidesPrompt(input);
    return output!;
  }
);