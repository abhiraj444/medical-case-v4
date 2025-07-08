import { appRoute } from '@genkit-ai/next';
import { suggestNewTopicsFlow } from '@/ai/flows/suggest-new-topics';

console.log('Loading suggest-topics API route');
console.log('suggestNewTopics imported:', suggestNewTopicsFlow);

export const POST = appRoute(suggestNewTopicsFlow);