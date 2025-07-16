import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Question {
  id: string;
  question_text: string;
  question_type: 'text' | 'multiple_choice';
  options?: string[];
  is_required: boolean;
  order_index: number;
}

interface FormBuilderProps {
  onClose: () => void;
  onFormCreated: () => void;
}

export const FormBuilder = ({ onClose, onFormCreated }: FormBuilderProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    question_type: 'text' as 'text' | 'multiple_choice',
    options: [''],
    is_required: false,
  });

  const addQuestion = () => {
    if (!newQuestion.question_text.trim()) {
      toast({
        title: 'Error',
        description: 'Question text is required',
        variant: 'destructive',
      });
      return;
    }

    const question: Question = {
      id: Math.random().toString(36).substr(2, 9),
      question_text: newQuestion.question_text,
      question_type: newQuestion.question_type,
      options: newQuestion.question_type === 'multiple_choice' 
        ? newQuestion.options.filter(opt => opt.trim()) 
        : undefined,
      is_required: newQuestion.is_required,
      order_index: questions.length,
    };

    setQuestions([...questions, question]);
    setNewQuestion({
      question_text: '',
      question_type: 'text',
      options: [''],
      is_required: false,
    });
  };

  const removeQuestion = (id: string) => {
    setQuestions(questions.filter(q => q.id !== id));
  };

  const addOption = () => {
    setNewQuestion({
      ...newQuestion,
      options: [...newQuestion.options, ''],
    });
  };

  const updateOption = (index: number, value: string) => {
    const updatedOptions = [...newQuestion.options];
    updatedOptions[index] = value;
    setNewQuestion({
      ...newQuestion,
      options: updatedOptions,
    });
  };

  const removeOption = (index: number) => {
    if (newQuestion.options.length > 1) {
      const updatedOptions = newQuestion.options.filter((_, i) => i !== index);
      setNewQuestion({
        ...newQuestion,
        options: updatedOptions,
      });
    }
  };

  const saveForm = async () => {
    if (!formData.title.trim()) {
      toast({
        title: 'Error',
        description: 'Form title is required',
        variant: 'destructive',
      });
      return;
    }

    if (questions.length === 0) {
      toast({
        title: 'Error',
        description: 'At least one question is required',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Create the form
      const { data: formData_result, error: formError } = await supabase
        .from('forms')
        .insert({
          title: formData.title,
          description: formData.description,
          creator_id: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (formError) throw formError;

      // Create the questions
      const questionsToInsert = questions.map(question => ({
        form_id: formData_result.id,
        question_text: question.question_text,
        question_type: question.question_type,
        options: question.options,
        is_required: question.is_required,
        order_index: question.order_index,
      }));

      const { error: questionsError } = await supabase
        .from('form_questions')
        .insert(questionsToInsert);

      if (questionsError) throw questionsError;

      toast({
        title: 'Success',
        description: 'Form created successfully!',
      });

      onFormCreated();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create form',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={onClose}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Form Builder</h1>
              <p className="text-muted-foreground">Create a new feedback form</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        <div className="space-y-8">
          {/* Form Details */}
          <Card>
            <CardHeader>
              <CardTitle>Form Details</CardTitle>
              <CardDescription>Basic information about your feedback form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="form-title">Form Title</Label>
                <Input
                  id="form-title"
                  placeholder="Enter form title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="form-description">Description (Optional)</Label>
                <Textarea
                  id="form-description"
                  placeholder="Enter form description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Add Question */}
          <Card>
            <CardHeader>
              <CardTitle>Add Question</CardTitle>
              <CardDescription>Create questions for your feedback form</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question-text">Question Text</Label>
                <Input
                  id="question-text"
                  placeholder="Enter your question"
                  value={newQuestion.question_text}
                  onChange={(e) => setNewQuestion({ ...newQuestion, question_text: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Question Type</Label>
                <Select
                  value={newQuestion.question_type}
                  onValueChange={(value: 'text' | 'multiple_choice') => 
                    setNewQuestion({ ...newQuestion, question_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Input</SelectItem>
                    <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {newQuestion.question_type === 'multiple_choice' && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder={`Option ${index + 1}`}
                        value={option}
                        onChange={(e) => updateOption(index, e.target.value)}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeOption(index)}
                        disabled={newQuestion.options.length === 1}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" onClick={addOption}>
                    <Plus className="mr-2 h-4 w-4" />
                    Add Option
                  </Button>
                </div>
              )}

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="required"
                  checked={newQuestion.is_required}
                  onCheckedChange={(checked) => 
                    setNewQuestion({ ...newQuestion, is_required: checked as boolean })
                  }
                />
                <Label htmlFor="required">Required question</Label>
              </div>

              <Button onClick={addQuestion}>
                <Plus className="mr-2 h-4 w-4" />
                Add Question
              </Button>
            </CardContent>
          </Card>

          {/* Questions List */}
          {questions.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Questions ({questions.length})</CardTitle>
                <CardDescription>Preview of your form questions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {questions.map((question, index) => (
                    <div key={question.id} className="flex items-start gap-4 p-4 border rounded-lg">
                      <GripVertical className="h-5 w-5 text-muted-foreground mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">Q{index + 1}. {question.question_text}</span>
                          {question.is_required && (
                            <Badge variant="destructive" className="text-xs">Required</Badge>
                          )}
                          <Badge variant="secondary" className="text-xs">
                            {question.question_type === 'text' ? 'Text' : 'Multiple Choice'}
                          </Badge>
                        </div>
                        {question.options && (
                          <div className="text-sm text-muted-foreground">
                            Options: {question.options.join(', ')}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeQuestion(question.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Save Form */}
          <div className="flex justify-end gap-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={saveForm} disabled={loading}>
              {loading ? 'Saving...' : 'Save Form'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};