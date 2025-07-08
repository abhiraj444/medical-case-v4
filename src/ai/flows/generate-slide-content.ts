'use server';

/**
 * @fileOverview Generates a slide outline from a given educational topic in a structured JSON format.
 *
 * - generateSlideOutline - A function that generates a slide outline.
 * - GenerateSlideOutlineInput - The input type for the generateSlideOutline function.
 * - GenerateSlideOutlineOutput - The return type for the generateSlideOutline function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { Slide } from '@/types';

const GenerateSlideContentInputSchema = z.object({
  topic: z.string().describe('The main topic for the presentation.'),
  question: z.string().optional().describe("The AI's direct answer to the question."),
  answer: z.string().optional().describe("The AI's detailed reasoning for the answer."),
  reasoning: z.string().optional().describe("The AI's detailed reasoning for the answer."),
  selectedTopics: z.array(z.string()).describe('The topics selected by the user for slide generation.'),
  fullQuestion: z.string().optional().describe('The full original question from the user.'),
  fullAnswer: z.string().optional().describe('The full original answer from the AI.'),
  fullReasoning: z.string().optional().describe('The full original reasoning from the AI.'),
});
export type GenerateSlideContentInput = z.infer<typeof GenerateSlideContentInputSchema>;

// Schemas for structured content
const ParagraphSchema = z.object({
  type: z.enum(['paragraph']),
  text: z.string().describe('A paragraph of text.'),
  bold: z.array(z.string()).optional().describe('An array of substrings from the text to be bolded.'),
});

const ListItemSchema = z.object({
  text: z.string().describe('The text for a single list item.'),
  bold: z.array(z.string()).optional().describe('An array of substrings from the text to be bolded.'),
});

const BulletListSchema = z.object({
  type: z.enum(['bullet_list']),
  items: z.array(ListItemSchema).describe('An array of bullet point objects.'),
});

const NumberedListSchema = z.object({
  type: z.enum(['numbered_list']),
  items: z.array(ListItemSchema).describe('An array of numbered list item objects.'),
});

const NoteSchema = z.object({
  type: z.enum(['note']),
  text: z.string().describe('A short note or annotation.'),
});

const TableRowSchema = z.object({
  cells: z.array(z.string()).describe('An array of strings representing the cells in this row.'),
});

const TableSchema = z.object({
  type: z.enum(['table']),
  headers: z.array(z.string()).describe('An array of strings for the table headers.'),
  rows: z.array(TableRowSchema).describe('An array of row objects, where each object contains the cells for a table row.'),
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
  content: z.array(ContentItemSchema).describe('An array of content items for the slide body.'),
});

const GenerateSlideContentOutputSchema = z.array(SlideSchema);
export type GenerateSlideContentOutput = z.infer<typeof GenerateSlideContentOutputSchema>;

export async function generateSlideContent(input: GenerateSlideContentInput): Promise<GenerateSlideContentOutput> {
  const result = await generateSlideContentFlow(input) as Slide[];
  return result;
}

const prompt = ai.definePrompt({
  name: 'generateSlideContentPrompt',
  input: {schema: GenerateSlideContentInputSchema},
  output: {schema: GenerateSlideContentOutputSchema},
  prompt: `You are an expert in medical education. Your task is to generate detailed slide content for a presentation based on the provided selected topics. The content should be technically rich, detailed, and suitable for a professional medical audience.\n\n**Source Information:**\n- **Main Topic:** {{{topic}}}\n\n**Core Instructions:**\n\n1.  **Generate content ONLY for the topics listed in "Selected Topics for Generation".**\n2.  **For each selected topic, generate a separate slide.**\n3.  **Handle "Clinical Question, Answer, and Analysis Summary" Topic:**\n    *   If "Clinical Question, Answer, and Analysis Summary" is present in the selected topics:\n        *   The slide for this topic MUST be titled "Case Presentation".\n        *   Its content MUST include the "Full Original Question", "Full Original Answer", and a concise summary of the "Full Original Reasoning".\n        *   This slide should be the first slide in the output array if selected.\n        *   Full Original Question: {{#if fullQuestion}}{{{fullQuestion}}}{{else}}Not provided.{{/if}}\n        *   Full Original Answer: {{#if fullAnswer}}{{{fullAnswer}}}{{else}}Not provided.{{/if}}\n        *   Full Original Reasoning: {{#if fullReasoning}}{{{fullReasoning}}}{{else}}Not provided.{{/if}}\n4.  **Content Guidelines (for other topics):**\n    *   The content must be **highly technical and condensed**.\n    *   Fill each slide with substantial information. Use tables frequently to compare/contrast concepts or summarize data for better understanding.\n    *   Do **NOT** include a "Conclusion" or "Summary" slide. The presentation should end on a technical note.\n\n**Formatting Rules:**\nFormat the entire output as a JSON array of slide objects. Each slide object must conform to the following rules:\n1.  **Slide Object**: Each slide is an object with a "title" (string) and a "content" (array of content items).\n2.  **Content Breakdown**: Deconstruct complex topics into multiple small, distinct points. Use \`bullet_list\` or \`numbered_list\` extensively. Each item in a list should be concise. Avoid long paragraphs; use lists to convey information concisely. For each slide, aim for a maximum of 6-8 distinct points (bullets, list items, or table rows) to ensure clarity and readability.\n3.  **Content Array**: The "content" array contains different types of content objects. Do NOT put too much content on a single slide; create more slides if a topic is complex. Each content item must be an object with a "type" field.\n4.  **Bolding**: For "paragraph" and list "items", use the \`bold\` array to specify substrings of the \`text\` that should be bolded. **Do NOT use markdown like \`**text**\` inside any text fields.**\n\nSupported "type" values for content items:\n- **"paragraph"**: For a block of text. This should be used sparingly.\n  - "text": The full paragraph string.\n  - "bold": (Optional) An array of substrings from "text" that should be formatted as bold.\n- **"bullet_list"**: For an unordered list.\n  - "items": An array of list item objects. Each object must have a "text" field and can have an optional "bold" array.\n- **"numbered_list"**: For an ordered list.\n  - "items": An array of list item objects. Each object must have a "text" field and can have an optional "bold" array.\n- **"note"**: For a brief, supplementary note.\n  - "text": The content of the note.\n- **"table"**: For tabular data.\n  - "headers": An array of strings for the table column headers.\n  - "rows": An array of row objects. Each object has a "cells" property, which is an array of strings for that row.\n\nExample:\n[\n  {\n    "title": "Introduction to Condition X",\n    "content": [\n      { "type": "paragraph", "text": "Condition X is a chronic inflammatory disease affecting the joints.", "bold": ["Condition X", "chronic inflammatory disease"] },\n      { "type": "bullet_list", "items": [ { "text": "Symptom A" }, { "text": "Symptom B is more complex.", "bold": ["Symptom B"] } ] }\n    ]\n  },\n  {\n    "title": "Diagnostic Criteria",\n    "content": [\n       { "type": "table", "headers": ["Criteria", "Description"], "rows": [{ "cells": ["Criteria 1", "Details for 1"] }, { "cells": ["Criteria 2", "Details for 2"] }] }\n    ]\n  }\n]\n`,
});

const generateSlideContentFlow = ai.defineFlow(
  {
    name: 'generateSlideContentFlow',
    inputSchema: GenerateSlideContentInputSchema,
    outputSchema: GenerateSlideContentOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
