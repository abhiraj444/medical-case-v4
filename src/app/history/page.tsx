'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { type Case } from '@/types';
import { HistoryCard } from '@/components/HistoryCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function HistoryPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else {
      setLoading(false);
    }
  }, [user, authLoading, router]);
  
  if (authLoading || (!user)) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 py-8">
      <Card className="border shadow-sm">
        <CardHeader>
          <CardTitle>Case History</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Card className="shadow-lg max-w-2xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  Case is being loaded...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Please wait while your case history is loaded.
                </p>
              </CardContent>
            </Card>
          ) : (
            <p className="text-center text-muted-foreground">
              History is not available in this version.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}