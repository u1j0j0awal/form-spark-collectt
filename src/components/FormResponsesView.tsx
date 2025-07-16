import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Download, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Form {
  id: string;
  title: string;
  description: string;
}

interface Question {
  id: string;
  question_text: string;
  question_type: string;
  order_index: number;
}

interface Response {
  id: string;
  submitted_at: string;
  answers: Record<string, string>;
}

interface FormResponsesViewProps {
  formId: string;
  onBack: () => void;
}

export const FormResponsesView = ({ formId, onBack }: FormResponsesViewProps) => {
  const { toast } = useToast();
  const [form, setForm] = useState<Form | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Response[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFormData();
  }, [formId]);

  const fetchFormData = async () => {
    try {
      // Fetch form details
      const { data: formData, error: formError } = await supabase
        .from('forms')
        .select('id, title, description')
        .eq('id', formId)
        .single();

      if (formError) throw formError;
      setForm(formData);

      // Fetch questions
      const { data: questionsData, error: questionsError } = await supabase
        .from('form_questions')
        .select('id, question_text, question_type, order_index')
        .eq('form_id', formId)
        .order('order_index');

      if (questionsError) throw questionsError;
      setQuestions(questionsData);

      // Fetch responses with answers
      const { data: responsesData, error: responsesError } = await supabase
        .from('form_responses')
        .select(`
          id,
          submitted_at,
          question_responses!inner(
            question_id,
            answer_text
          )
        `)
        .eq('form_id', formId)
        .order('submitted_at', { ascending: false });

      if (responsesError) throw responsesError;

      // Transform responses data
      const transformedResponses = responsesData.map(response => {
        const answers: Record<string, string> = {};
        response.question_responses.forEach((qr: any) => {
          answers[qr.question_id] = qr.answer_text || '';
        });

        return {
          id: response.id,
          submitted_at: response.submitted_at,
          answers,
        };
      });

      setResponses(transformedResponses);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch form data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (responses.length === 0) {
      toast({
        title: 'No data',
        description: 'No responses to export',
        variant: 'destructive',
      });
      return;
    }

    // Create CSV headers
    const headers = ['Submission Date', ...questions.map(q => q.question_text)];
    
    // Create CSV rows
    const rows = responses.map(response => [
      new Date(response.submitted_at).toLocaleString(),
      ...questions.map(q => response.answers[q.id] || '')
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map(row => row.map(cell => `"${cell.replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${form?.title}-responses.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Export completed',
      description: 'CSV file has been downloaded',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading responses...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Form not found</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{form.title}</h1>
              <p className="text-muted-foreground">Form Responses</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={exportToCSV} disabled={responses.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Responses</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{responses.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Questions</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{questions.length}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Latest Response</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm">
                {responses.length > 0 
                  ? new Date(responses[0].submitted_at).toLocaleDateString()
                  : 'No responses yet'
                }
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Responses Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Responses</CardTitle>
            <CardDescription>
              Detailed view of all form submissions
            </CardDescription>
          </CardHeader>
          <CardContent>
            {responses.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No responses yet</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Share your form link to start collecting feedback
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submitted</TableHead>
                      {questions.map((question) => (
                        <TableHead key={question.id} className="min-w-[200px]">
                          {question.question_text}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {responses.map((response) => (
                      <TableRow key={response.id}>
                        <TableCell className="font-medium">
                          {new Date(response.submitted_at).toLocaleString()}
                        </TableCell>
                        {questions.map((question) => (
                          <TableCell key={question.id}>
                            {response.answers[question.id] || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};