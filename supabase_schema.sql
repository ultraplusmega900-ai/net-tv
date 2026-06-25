-- Migration for Netflix Replica (Supabase schema)
-- Paste this script into the Supabase SQL Editor (https://supabase.com/dashboard/project/_/sql)

-- 1. Create Profiles Table (extends Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    avatar_url TEXT DEFAULT 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to profiles" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Allow users to update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 2. Create Favorites (My List) Table
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    description TEXT,
    genre TEXT,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, video_id)
);

-- Enable RLS on Favorites
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites" 
ON public.favorites FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to their favorites" 
ON public.favorites FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove from their favorites" 
ON public.favorites FOR DELETE USING (auth.uid() = user_id);

-- 3. Create Watch History Table
CREATE TABLE IF NOT EXISTS public.watch_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    video_id TEXT NOT NULL,
    title TEXT NOT NULL,
    thumbnail_url TEXT NOT NULL,
    duration TEXT,
    progress_percent INT DEFAULT 0,
    watched_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS on Watch History
ALTER TABLE public.watch_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watch history" 
ON public.watch_history FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can log their watch history" 
ON public.watch_history FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their watch history" 
ON public.watch_history FOR DELETE USING (auth.uid() = user_id);

-- 4. Set up Auto-profile generation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuário Netflix'),
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run handle_new_user() on auth.users signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
