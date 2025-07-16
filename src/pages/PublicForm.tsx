import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Form {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
}

interface Question {
  id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice';
  options?: string[];
  is_required: boolean;
  order_index: number;
}

export const PublicForm = () => {
  const { formId } = useParams<{ formId: string }>();
  const { toast } = useToast();
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (formId) {
      fetchForm();
    }
  }, [formId]);

  const fetchForm = async () => {
    try {
      // Fetch form details
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('id, title, description, is_active')
        .eq('id', formId)
        .single();

      if (formError) throw formError;
      
      if (!formData.is_active) {
        throw new Error('This form is no longer accepting responses');
      }

      setForm(formData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('form_questions')
        .select('id, question_text, question_type, options, is_required, order_index')
        .eq('form_id', formId)
        .order('order_index');

      if (questionsError) throw questionsError;
      setQuestions(questionsData as Question[]);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to load form',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: value,
    }));
  };

  const validateForm = () => {
    const requiredQuestions = questions.filter(q => q.is_required);
    for (const question of requiredQuestions) {
      if (!answers[question.id] || answers[question.id].trim() === '') {
        toast({
          title: 'Validation Error',
          description: `Please answer: ${question.question_text}`,
          variant: 'destructive',
        });
        return false;
      }
    }
    return true;
  };

  const submitForm = async () => {
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      // Create form response
      const { data: responseData, error: responseError } = await supabase
        .from('form_responses')
        .insert({
          form_id: formId,
        })
        .select()
        .single();

      if (responseError) throw responseError;

      // Create question responses
      const questionResponses = Object.entries(answers).map(([questionId, answer]) => ({
        form_response_id: responseData.id,
        question_id: questionId,
        answer_text: answer,
      }));

      const { error: questionsError } = await supabase
        .from('question_responses')
        .insert(questionResponses);

      if (questionsError) throw questionsError;

      setSubmitted(true);
      toast({
        title: 'Success',
        description: 'Your response has been submitted successfully!',
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit response',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading form...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>Form Not Found</CardTitle>
            <CardDescription>
              The form you're looking for doesn't exist or is no longer available.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <CardTitle>Thank You!</CardTitle>
            <CardDescription>
              Your response has been submitted successfully. We appreciate your feedback.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">{form.title}</CardTitle>
            {form.description && (
              <CardDescription className="text-base">
                {form.description}
              </CardDescription>
            )}
          </CardHeader>
          <CardContent className="space-y-8">
            {questions.map((question, index) => (
              <div key={question.id} className="space-y-3">
                <Label className="text-base font-medium">
                  {index + 1}. {question.question_text}
                  {question.is_required && (
                    <Badge variant="destructive" className="ml-2 text-xs">
                      Required
                    </Badge>
                  )}
                </Label>

                {question.question_type === 'text' ? (
                  <Textarea
                    placeholder="Enter your answer..."
                    value={answers[question.id] || ''}
                    onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                    className="min-h-[100px]"
                  />
                ) : (
                  <RadioGroup
                    value={answers[question.id] || ''}
                    onValueChange={(value) => handleAnswerChange(question.id, value)}
                  >
                    {question.options?.map((option, optionIndex) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        <RadioGroupItem value={option} id={`${question.id}-${optionIndex}`} />
                        <Label 
                          htmlFor={`${question.id}-${optionIndex}`}
                          className="font-normal cursor-pointer"
                        >
                          {option}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </div>
            ))}

            <div className="pt-6">
              <Button 
                onClick={submitForm} 
                disabled={submitting}
                className="w-full"
                size="lg"
              >
                {submitting ? 'Submitting...' : 'Submit Response'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};