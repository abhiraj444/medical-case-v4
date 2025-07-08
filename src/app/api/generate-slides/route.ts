import { appRoute } from '@genkit-ai/next';
import { generateSlideContent } from '@/ai/flows/generate-slide-content';

export const POST = appRoute(generateSlideContent);
