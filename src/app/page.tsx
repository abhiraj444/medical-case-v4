'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BrainCircuit, Wand2, History as HistoryIcon } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const { user } = useAuth();
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <div className="mx-auto grid w-full max-w-5xl gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card
          className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          onClick={() => handleNavigate('/ai-diagnosis')}
        >
          <CardHeader>
            <div className="flex items-center gap-4">
              <BrainCircuit className="h-8 w-8 text-primary" />
              <CardTitle>Start New Diagnosis</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Input patient data to receive AI-generated provisional diagnoses.
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          onClick={() => handleNavigate('/content-generator')}
        >
          <CardHeader>
            <div className="flex items-center gap-4">
              <Wand2 className="h-8 w-8 text-primary" />
              <CardTitle>Ask Clinical Question</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Get detailed answers to clinical questions or generate presentation outlines.
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer transition-all duration-300 hover:scale-[1.02] hover:shadow-lg"
          onClick={() => handleNavigate(user ? '/history' : '/login')}
        >
          <CardHeader>
            <div className="flex items-center gap-4">
              <HistoryIcon className="h-8 w-8 text-primary" />
              <CardTitle>History</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Review and manage your past AI diagnosis and content generation cases.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}