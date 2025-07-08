import { appRoute } from '@genkit-ai/next';
import { generatePresentationOutline } from '@/ai/flows/generate-presentation-outline';

export const POST = appRoute(generatePresentationOutline);
