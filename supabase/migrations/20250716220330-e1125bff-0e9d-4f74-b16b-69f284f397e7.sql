-- Create profiles table for admin users
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create forms table
CREATE TABLE public.forms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_questions table
CREATE TABLE public.form_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('text', 'multiple_choice')),
  options JSONB, -- For multiple choice options
  is_required BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create form_responses table (one per form submission)
CREATE TABLE public.form_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_id UUID NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ip_address INET
);

-- Create question_responses table (individual answers)
CREATE TABLE public.question_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  form_response_id UUID NOT NULL REFERENCES public.form_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.form_questions(id) ON DELETE CASCADE,
  answer_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Forms policies
CREATE POLICY "Users can view their own forms" 
ON public.forms 
FOR SELECT 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can create their own forms" 
ON public.forms 
FOR INSERT 
WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their own forms" 
ON public.forms 
FOR UPDATE 
USING (auth.uid() = creator_id);

CREATE POLICY "Users can delete their own forms" 
ON public.forms 
FOR DELETE 
USING (auth.uid() = creator_id);

-- Form questions policies
CREATE POLICY "Users can view questions of their forms" 
ON public.form_questions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE forms.id = form_questions.form_id 
  AND forms.creator_id = auth.uid()
));

CREATE POLICY "Users can create questions for their forms" 
ON public.form_questions 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE forms.id = form_questions.form_id 
  AND forms.creator_id = auth.uid()
));

CREATE POLICY "Users can update questions of their forms" 
ON public.form_questions 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE forms.id = form_questions.form_id 
  AND forms.creator_id = auth.uid()
));

CREATE POLICY "Users can delete questions of their forms" 
ON public.form_questions 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE forms.id = form_questions.form_id 
  AND forms.creator_id = auth.uid()
));

-- Public can view questions for active forms
CREATE POLICY "Public can view questions for active forms" 
ON public.form_questions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE forms.id = form_questions.form_id 
  AND forms.is_active = true
));

-- Form responses policies
CREATE POLICY "Users can view responses to their forms" 
ON public.form_responses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE forms.id = form_responses.form_id 
  AND forms.creator_id = auth.uid()
));

CREATE POLICY "Public can create form responses" 
ON public.form_responses 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.forms 
  WHERE forms.id = form_responses.form_id 
  AND forms.is_active = true
));

-- Question responses policies
CREATE POLICY "Users can view question responses to their forms" 
ON public.question_responses 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.form_responses fr
  JOIN public.forms f ON f.id = fr.form_id
  WHERE fr.id = question_responses.form_response_id 
  AND f.creator_id = auth.uid()
));

CREATE POLICY "Public can create question responses" 
ON public.question_responses 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.form_responses fr
  JOIN public.forms f ON f.id = fr.form_id
  WHERE fr.id = question_responses.form_response_id 
  AND f.is_active = true
));

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_forms_updated_at
  BEFORE UPDATE ON public.forms
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user profiles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();