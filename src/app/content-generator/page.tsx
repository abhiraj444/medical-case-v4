'use client';

import { useState, type ChangeEvent, type ClipboardEvent, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { answerClinicalQuestion, type AnswerClinicalQuestionOutput } from '@/ai/flows/answer-clinical-question';
import { summarizeQuestion } from '@/ai/flows/summarize-question';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Wand2, Lightbulb, FileText, Bot, BrainCircuit, PlusCircle, Copy, X } from 'lucide-react';
import { SlideEditor } from '@/components/SlideEditor';
import type { Slide } from '@/components/SlideEditor';
import { useAuth } from '@/hooks/useAuth';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { collection, serverTimestamp, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import type { StructuredQuestion } from '@/types';
import { QuestionDisplay } from '@/components/QuestionDisplay';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Header from '@/components/Header';


export default function ContentGeneratorPage() {
  const [mode, setMode] = useState<'question' | 'topic'>('question');
  
  const [question, setQuestion] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  
  const [topic, setTopic] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnswerClinicalQuestionOutput | null>(null);
  const [structuredQuestion, setStructuredQuestion] = useState<StructuredQuestion | null>(null);
  const [slides, setSlides] = useState<Slide[] | null>(null);
  const [presentationOutline, setPresentationOutline] = useState<string[] | null>(null);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>([]);
  const [usedTopics, setUsedTopics] = useState<string[]>([]);
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);

  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    }
  }, [user, authLoading, router]);

   useEffect(() => {
    const caseId = searchParams.get('caseId');
    if (caseId && user && caseId !== currentCaseId) {
      const loadCase = async () => {
        setIsLoading(true);
        try {
          const caseRef = doc(db, 'cases', caseId);
          const caseSnap = await getDoc(caseRef);
          if (caseSnap.exists() && caseSnap.data().userId === user.uid) {
            const caseData = caseSnap.data();
            setMode(caseData.inputData.mode);
            setQuestion(caseData.inputData.question || '');
            setImageFiles([]);
            if (caseData.inputData.structuredQuestion) {
              setStructuredQuestion({
                ...caseData.inputData.structuredQuestion,
                images: caseData.inputData.images || [],
              });
            } else {
              setStructuredQuestion(null);
            }
            setImagePreviews(caseData.inputData.images || []);

            if (caseData.outputDataUrl) {
              try {
                const response = await fetch(caseData.outputDataUrl);
                if (!response.ok) {
                  throw new Error(`Failed to fetch output data: ${response.statusText}`);
                }
                const outputData = await response.json();
                setResult(outputData.result || null);
                setSlides(outputData.slides || null);
                setPresentationOutline(outputData.outline || null);
                setSuggestedTopics(outputData.suggestedTopics || []);
                setUsedTopics(outputData.usedTopics || []);
              } catch (e) {
                console.error("Failed to parse output data from storage", e);
                toast({ title: "Error", description: "Failed to load case results from storage.", variant: 'destructive' });
                setResult(null);
                setSlides(null);
              }
            } else {
              // Handle older data structure for backward compatibility
              setResult(caseData.outputData?.result);
              setSlides(caseData.outputData?.slides);
            }

            setCurrentCaseId(caseId);
            toast({ title: "Case Loaded", description: `Successfully loaded case: ${caseData.title}` });
          } else {
             toast({ title: "Error", description: "Could not find or access the specified case.", variant: 'destructive'});
             router.push('/content-generator');
          }
        } catch (error) {
            console.error("Failed to load case:", error);
            toast({ title: "Error", description: "Failed to load the case from history.", variant: 'destructive'});
            router.push('/content-generator');
        } finally {
            setIsLoading(false);
        }
      };
      loadCase();
    }
  }, [searchParams, user, router, toast, currentCaseId]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setImageFiles(prev => [...prev, ...newFiles]);
      const newPreviews = newFiles.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const handleRemoveImage = (indexToRemove: number) => {
    setImageFiles(imageFiles.filter((_, index) => index !== indexToRemove));
    setImagePreviews(imagePreviews.filter((_, index) => index !== indexToRemove));
  };

  const handlePaste = (event: ClipboardEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const items = event.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
            const file = items[i].getAsFile();
            if (file) {
                setImageFiles(prev => [...prev, file]);
                setImagePreviews(prev => [...prev, URL.createObjectURL(file)]);
                toast({
                    title: "Image Pasted",
                    description: `Pasted image from clipboard.`,
                });
                break;
            }
        }
    }
  };

  const fileToDataUri = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleQuestionSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setResult(null);
    setSlides(null);
    setStructuredQuestion(null);

    try {
      const imageUrls = await Promise.all(
        imageFiles.map(async (file) => {
          const storageRef = ref(storage, `uploads/${user.uid}/${uuidv4()}-${file.name}`);
          await uploadBytes(storageRef, file);
          return getDownloadURL(storageRef);
        })
      );

      const images = await Promise.all(imageFiles.map(fileToDataUri));
      
      const [response, summaryResponse] = await Promise.all([
        answerClinicalQuestion({
          question: question.trim() || undefined,
          images: images.length > 0 ? images : undefined,
        }),
        summarizeQuestion({
          question: question.trim() || undefined,
          images: images.length > 0 ? images : undefined,
        })
      ]);

      setResult(response);
      const newStructuredQuestion = { summary: summaryResponse.summary, images: imageUrls };
      setStructuredQuestion(newStructuredQuestion);

      const outputData = {
        result: response,
        slides: null, // Slides are generated later
      };

      const caseId = currentCaseId || doc(collection(db, 'cases')).id;

      const outputDataString = JSON.stringify(outputData);
      const outputDataBlob = new Blob([outputDataString], { type: 'application/json' });
      const storageRef = ref(storage, `outputs/${user.uid}/${caseId}.json`);
      await uploadBytes(storageRef, outputDataBlob);
      const outputDataUrl = await getDownloadURL(storageRef);

      const caseData = {
          userId: user.uid,
          type: 'content-generator' as const,
          title: response.topic,
          createdAt: serverTimestamp(),
          inputData: {
              mode: 'question' as const,
              question: question.trim() || null,
              images: imageUrls.length > 0 ? imageUrls : null,
              topic: null,
              structuredQuestion: newStructuredQuestion,
          },
          outputDataUrl: outputDataUrl,
      };
      
      if (currentCaseId) {
        const caseRef = doc(db, 'cases', currentCaseId);
        await updateDoc(caseRef, caseData);
        toast({ title: 'Case Updated', description: 'Your case has been updated in your history.' });
      } else {
        const caseRef = doc(db, 'cases', caseId);
        await setDoc(caseRef, caseData);
        setCurrentCaseId(caseId);
        toast({ title: 'Case Saved', description: 'Your content generation case has been saved to your history.' });
      }

    } catch (error) {
      console.error('Clinical question failed:', error);
      toast({
        title: 'An Error Occurred',
        description: 'Failed to get an answer. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleTopicSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) {
      toast({ title: "Not Authenticated", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    setResult(null);
    setSlides(null);
    setStructuredQuestion(null);
    setPresentationOutline(null);

    try {
      // Directly call the outline generation API
      const response = await fetch('/api/content-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateOutline',
          payload: { topic: topic.trim() }, // Pass the topic to the backend
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate outline');
      }

      const data = await response.json();
      setPresentationOutline(data.outline);
      setSelectedTopics(data.outline);

      // Create a mock result object to display the topic
      const summaryResult = {
        answer: `This is a general overview for the topic: **${topic}**. You can now generate a presentation outline based on this.`,
        reasoning: '',
        topic: topic,
      };
      setResult(summaryResult);

      const caseId = currentCaseId || doc(collection(db, 'cases')).id;
      const caseData = {
        userId: user.uid,
        type: 'content-generator' as const,
        title: topic,
        createdAt: serverTimestamp(),
        inputData: {
          mode: 'topic' as const,
          question: null,
          images: null,
          topic: topic.trim() || null,
          structuredQuestion: null,
        },
        outputDataUrl: '', // This will be updated later
      };

      if (currentCaseId) {
        const caseRef = doc(db, 'cases', currentCaseId);
        await updateDoc(caseRef, caseData);
        toast({ title: 'Case Updated', description: 'Your case has been updated in your history.' });
      } else {
        const caseRef = doc(db, 'cases', caseId);
        await setDoc(caseRef, caseData);
        setCurrentCaseId(caseId);
        toast({ title: 'Case Saved', description: 'Your content generation case has been saved to your history.' });
      }

    } catch (error) {
      console.error('Topic submission failed:', error);
      toast({
        title: 'An Error Occurred',
        description: 'Failed to process topic. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateOutline = async () => {
    if (!user || !currentCaseId) return;

    let payload;
    if (mode === 'question') {
      if (!result?.topic) return;
      payload = {
        action: 'generateOutline',
        payload: {
          question: structuredQuestion?.summary || '',
          answer: result.answer,
          reasoning: result.reasoning,
        },
      };
    } else {
      if (!topic) return;
      payload = {
        action: 'generateOutline',
        payload: { topic: topic.trim() },
      };
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/content-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      setPresentationOutline(data.outline);
      setSelectedTopics(data.outline);
    } catch (error) {
      console.error('Outline generation failed:', error);
      toast({
        title: 'An Error Occurred',
        description: 'Failed to generate outline. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePresentation = async () => {
    if (!result?.topic || !user || !currentCaseId || selectedTopics.length === 0) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/content-generator', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'generateSlides',
          payload: {
            topic: result.topic,
            question: structuredQuestion?.summary,
            answer: result.answer,
            reasoning: result.reasoning,
            selectedTopics,
            fullQuestion: question, // Pass the full question
            fullAnswer: result.answer, // Pass the full answer
            fullReasoning: result.reasoning, // Pass the full reasoning
          },
        }),
      });
      const generatedSlides = await response.json();
      setSlides(generatedSlides);

      const caseRef = doc(db, 'cases', currentCaseId);
      const caseSnap = await getDoc(caseRef);
      if (!caseSnap.exists()) {
        toast({ title: "Error", description: "Case not found.", variant: "destructive" });
        return;
      }

      const caseData = caseSnap.data();
      const outputDataResponse = await fetch(caseData.outputDataUrl);
      const outputData = await outputDataResponse.json();

      outputData.slides = generatedSlides;
      outputData.outline = presentationOutline;

      const outputDataString = JSON.stringify(outputData);
      const outputDataBlob = new Blob([outputDataString], { type: 'application/json' });
      const storageRef = ref(storage, `outputs/${user.uid}/${currentCaseId}.json`);
      await uploadBytes(storageRef, outputDataBlob);
      const newOutputDataUrl = await getDownloadURL(storageRef);

      await updateDoc(caseRef, {
        outputDataUrl: newOutputDataUrl,
      });

      toast({ title: 'Presentation Generated', description: 'Your presentation has been added to the case.' });
    } catch (error) {
      console.error('Presentation generation failed:', error);
      toast({
        title: 'An Error Occurred',
        description: 'Failed to generate presentation. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetStateForNewEntry = (newMode: 'question' | 'topic') => {
    setMode(newMode);
    setQuestion('');
    setImageFiles([]);
    setImagePreviews([]);
    setTopic('');
    setResult(null);
    setSlides(null);
    setCurrentCaseId(null);
    setStructuredQuestion(null);
    setPresentationOutline(null);
    setSelectedTopics([]);
    setSuggestedTopics([]);
    setUsedTopics([]);
    router.push('/content-generator');
  };

  const handleNewCase = () => {
    resetStateForNewEntry('question');
  };
  
  const isQuestionSubmitDisabled = !question.trim() && imageFiles.length === 0;
  const isTopicSubmitDisabled = !topic.trim();

  const handleCopy = (textToCopy: string, type: string) => {
    const plainText = textToCopy.replace(/\*\*/g, '');
    navigator.clipboard.writeText(plainText).then(
      () => {
        toast({ title: 'Copied to clipboard', description: `The ${type} has been copied.` });
      },
      (err) => {
        toast({ title: 'Error', description: 'Failed to copy text.', variant: 'destructive' });
        console.error('Could not copy text: ', err);
      }
    );
  };

  const formatText = (text: string) => {
    if (!text) return '';
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br />');
  };
  
  if (authLoading || (!user && !searchParams.get('caseId'))) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl px-4 pt-8 pb-4">
      
      <div className="space-y-8">
        {!result && !isLoading && (
            <Card className="border shadow-sm">
                <CardHeader>
                    <CardTitle>Content Generator</CardTitle>
                    <CardDescription>
                    Select a mode to either analyze a clinical question or generate content for a medical topic.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs value={mode} onValueChange={(value) => resetStateForNewEntry(value as 'question' | 'topic')} className="w-full">
                    <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-2">
                        <TabsTrigger value="question">Specific Clinical Question</TabsTrigger>
                        <TabsTrigger value="topic">General Medical Topic</TabsTrigger>
                    </TabsList>
                    <TabsContent value="question" className="pt-4">
                        <form onSubmit={handleQuestionSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="question">Clinical Question (optional if image is provided)</Label>
                            <Textarea
                            id="question"
                            placeholder="e.g., 'What are the treatment options for this condition?' You can also paste an image from your clipboard here."
                            value={question}
                            onChange={(e) => setQuestion(e.target.value)}
                            onPaste={handlePaste}
                            disabled={isLoading}
                            className="min-h-[100px]"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="image">Supporting Image(s) (optional)</Label>
                            <Input
                                id="image"
                                type="file"
                                accept=".jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                onPaste={handlePaste}
                                disabled={isLoading}
                                multiple
                            />
                             {imagePreviews.length > 0 && (
                               <div className="mt-4 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                                {imagePreviews.map((preview, i) => (
                                  <div key={i} className="relative aspect-square">
                                    <img
                                      src={preview}
                                      alt={`preview ${i}`}
                                      className="h-full w-full object-cover rounded-md border"
                                    />
                                    <Button
                                      variant="destructive"
                                      size="icon"
                                      className="absolute top-1 right-1 h-6 w-6 bg-red-500 text-white hover:bg-red-600"
                                      onClick={() => handleRemoveImage(i)}
                                    >
                                      <X className="h-4 w-4" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            )}
                        </div>
                        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isQuestionSubmitDisabled}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <Bot />}
                            Get Answer
                        </Button>
                        </form>
                    </TabsContent>
                    <TabsContent value="topic" className="pt-4">
                        <form onSubmit={handleTopicSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="topic">Medical Topic</Label>
                            <Input
                            id="topic"
                            placeholder="e.g., 'Pathophysiology of Myocardial Infarction'"
                            value={topic}
                            onChange={(e) => setTopic(e.target.value)}
                            disabled={isLoading}
                            />
                        </div>
                        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading || isTopicSubmitDisabled}>
                            {isLoading ? <Loader2 className="animate-spin" /> : <Wand2 />}
                            Generate Presentation Outline
                        </Button>
                        </form>
                    </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        )}

        {isLoading && !result && (
          <Card className="shadow-lg max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                Content is getting generated...
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Please wait while the AI generates the content.
              </p>
            </CardContent>
          </Card>
        )}
        
        {structuredQuestion && (
            <QuestionDisplay summary={structuredQuestion.summary} images={structuredQuestion.images} />
        )}

        {result && (
          <Card className="border shadow-sm">
             <CardHeader>
              <div className="flex w-full items-start justify-between gap-4">
                <div className="flex-grow">
                  <CardTitle className="flex items-center gap-2">
                      <BrainCircuit className="text-primary"/>
                      AI Response
                  </CardTitle>
                  <CardDescription>Topic: {result.topic}</CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCopy(result.answer, 'answer')} aria-label="Copy answer">
                      <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={handleNewCase} disabled={isLoading} className="w-full shrink-0 sm:w-auto">
                      <PlusCircle />
                      New Case
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{__html: formatText(result.answer)}}></div>

                {result.reasoning && (
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1" className="border-b-0">
                            <AccordionTrigger>
                                <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary">
                                    <Lightbulb className="h-4 w-4" />
                                    Click here to see the detailed analysis
                                </div>
                            </AccordionTrigger>
                            <AccordionContent>
                                <div className="mt-2 rounded-md border border-border bg-reasoning text-reasoning-foreground p-4">
                                    <div className="flex items-start justify-between">
                                        <h4 className="font-semibold text-foreground mb-2 flex-grow">
                                            Reasoning
                                        </h4>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleCopy(result.reasoning, 'reasoning')}
                                            className="h-8 w-8 flex-shrink-0 -mr-2 -mt-2 text-muted-foreground hover:bg-muted hover:text-foreground"
                                            aria-label="Copy reasoning"
                                        >
                                            <Copy className="h-4 w-4" />
                                        </Button>
                                    </div>
                                    <div className="prose prose-sm max-w-none text-muted-foreground" dangerouslySetInnerHTML={{__html: formatText(result.reasoning)}}></div>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                )}
                
                {!slides && !presentationOutline && (
                  <div className="mt-4 flex flex-col sm:flex-row items-center gap-4 rounded-lg border p-4">
                      <Button onClick={handleGenerateOutline} disabled={isLoading} className="w-full sm:w-auto">
                          {isLoading ? <Loader2 className="animate-spin"/> : <Wand2 />}
                          Generate Presentation Outline
                      </Button>
                  </div>
                )}

                {presentationOutline && !slides && (
                  <div className="mt-4 rounded-lg border p-4">
                    <h3 className="text-lg font-semibold">Select Topics for Your Presentation</h3>
                    <div className="mt-4 space-y-2">
                      {presentationOutline.map((topic, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id={`topic-${index}`}
                            checked={selectedTopics.includes(topic)}
                            onChange={() => {
                              if (selectedTopics.includes(topic)) {
                                setSelectedTopics(selectedTopics.filter((t) => t !== topic));
                              } else {
                                setSelectedTopics([...selectedTopics, topic]);
                              }
                            }}
                          />
                          <label htmlFor={`topic-${index}`}>{topic}</label>
                        </div>
                      ))}
                    </div>
                    <Button onClick={handleGeneratePresentation} disabled={isLoading || selectedTopics.length === 0} className="mt-4 w-full sm:w-auto">
                      {isLoading ? <Loader2 className="animate-spin"/> : <Wand2 />}
                      Generate Presentation
                    </Button>
                  </div>
                )}
            </CardContent>
          </Card>
        )}

        {slides && result && (
            <SlideEditor
                key={result.topic}
                initialSlides={slides}
                topic={result.topic}
                caseId={currentCaseId}
                onRefresh={handleGeneratePresentation}
                onSlidesUpdate={async (updatedSlides) => {
                    setSlides(updatedSlides);
                    if (currentCaseId && user) {
                        try {
                            const caseRef = doc(db, 'cases', currentCaseId);
                            const caseSnap = await getDoc(caseRef);
                            if (!caseSnap.exists()) return;

                            const caseData = caseSnap.data();
                            const response = await fetch(caseData.outputDataUrl);
                            const outputData = await response.json();

                            outputData.slides = updatedSlides;

                            const outputDataString = JSON.stringify(outputData);
                            const outputDataBlob = new Blob([outputDataString], { type: 'application/json' });
                            const storageRef = ref(storage, `outputs/${user.uid}/${currentCaseId}.json`);
                            await uploadBytes(storageRef, outputDataBlob);
                            const newOutputDataUrl = await getDownloadURL(storageRef);

                            await updateDoc(caseRef, { outputDataUrl: newOutputDataUrl });
                        } catch (e) {
                            console.error("Failed to update slides in storage", e);
                            toast({ title: "Error", description: "Failed to save slide updates.", variant: 'destructive' });
                        }
                    }
                }}
                onNewCase={handleNewCase}
                questionContext={mode === 'topic' ? topic : structuredQuestion?.summary || result?.topic || ''}
                outline={presentationOutline || []}
                initialSuggestedTopics={suggestedTopics}
                initialUsedTopics={usedTopics}
                onTopicsUpdate={async (newSuggested, newUsed) => {
                  setSuggestedTopics(newSuggested);
                  setUsedTopics(newUsed);
                  if (currentCaseId && user) {
                    try {
                      const caseRef = doc(db, 'cases', currentCaseId);
                      const caseSnap = await getDoc(caseRef);
                      if (!caseSnap.exists()) return;

                      const caseData = caseSnap.data();
                      const response = await fetch(caseData.outputDataUrl);
                      const outputData = await response.json();

                      outputData.suggestedTopics = newSuggested;
                      outputData.usedTopics = newUsed;

                      const outputDataString = JSON.stringify(outputData);
                      const outputDataBlob = new Blob([outputDataString], { type: 'application/json' });
                      const storageRef = ref(storage, `outputs/${user.uid}/${currentCaseId}.json`);
                      await uploadBytes(storageRef, outputDataBlob);
                      const newOutputDataUrl = await getDownloadURL(storageRef);

                      await updateDoc(caseRef, { outputDataUrl: newOutputDataUrl });
                    } catch (e) {
                      console.error("Failed to update topics in storage", e);
                    }
                  }
                }}
            />
        )}
      </div>
    </div>
  );
}
