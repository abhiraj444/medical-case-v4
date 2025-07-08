import { appRoute } from '@genkit-ai/next';
import { modifySlides } from '@/ai/flows/modify-slides';

export const POST = appRoute(modifySlides);
