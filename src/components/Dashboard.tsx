import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Plus, BarChart3, FileText, Users, LogOut } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { FormBuilder } from './FormBuilder';
import { FormResponsesView } from './FormResponsesView';

interface Form {
  id: string;
  title: string;
  description: string;
  is_active: boolean;
  created_at: string;
  response_count?: number;
}

export const Dashboard = () => {
  const { user, signOut } = useAuth();
  const { toast } = useToast();
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [selectedFormId, setSelectedFormId] = useState<string | null>(null);

  useEffect(() => {
    fetchForms();
  }, []);

  const fetchForms = async () => {
    try {
      // Fetch forms with response counts
      const { data: formsData, error: formsError } = await supabase
        .from('forms')
        .select(`
          id,
          title,
          description,
          is_active,
          created_at
        `)
        .order('created_at', { ascending: false });

      if (formsError) throw formsError;

      // Get response counts for each form
      const formsWithCounts = await Promise.all(
        formsData.map(async (form) => {
          const { count } = await supabase
            .from('form_responses')
            .select('*', { count: 'exact', head: true })
            .eq('form_id', form.id);
          
          return { ...form, response_count: count || 0 };
        })
      );

      setForms(formsWithCounts);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch forms',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: 'Signed out',
      description: 'You have been signed out successfully',
    });
  };

  const copyFormLink = (formId: string) => {
    const link = `${window.location.origin}/form/${formId}`;
    navigator.clipboard.writeText(link);
    toast({
      title: 'Link copied',
      description: 'Form link has been copied to clipboard',
    });
  };

  const toggleFormStatus = async (formId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('forms')
        .update({ is_active: !currentStatus })
        .eq('id', formId);

      if (error) throw error;

      setForms(forms.map(form => 
        form.id === formId 
          ? { ...form, is_active: !currentStatus }
          : form
      ));

      toast({
        title: 'Form updated',
        description: `Form ${!currentStatus ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to update form status',
        variant: 'destructive',
      });
    }
  };

  if (showFormBuilder) {
    return (
      <FormBuilder
        onClose={() => setShowFormBuilder(false)}
        onFormCreated={() => {
          fetchForms();
          setShowFormBuilder(false);
        }}
      />
    );
  }

  if (selectedFormId) {
    return (
      <FormResponsesView
        formId={selectedFormId}
        onBack={() => setSelectedFormId(null)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Feedback Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user?.email}</p>
          </div>
          <Button variant="outline" onClick={handleSignOut}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-3xl font-bold">Your Forms</h2>
            <p className="text-muted-foreground">Create and manage your feedback forms</p>
          </div>
          <Button onClick={() => setShowFormBuilder(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create New Form
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading forms...</p>
          </div>
        ) : forms.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <CardTitle className="mb-2">No forms yet</CardTitle>
              <CardDescription className="mb-4">
                Create your first feedback form to get started
              </CardDescription>
              <Button onClick={() => setShowFormBuilder(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {forms.map((form) => (
              <Card key={form.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{form.title}</CardTitle>
                    <Badge variant={form.is_active ? 'default' : 'secondary'}>
                      {form.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {form.description && (
                    <CardDescription>{form.description}</CardDescription>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {form.response_count} responses
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="h-4 w-4" />
                      {new Date(form.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyFormLink(form.id)}
                      className="flex-1"
                    >
                      Copy Link
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedFormId(form.id)}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleFormStatus(form.id, form.is_active)}
                    >
                      {form.is_active ? 'Deactivate' : 'Activate'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};