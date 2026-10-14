-- ==============================================================================
-- STUDENTSKÝ BAZAR - SUPABASE SCHEMA & POLICIES
-- ==============================================================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Create public.profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  phone TEXT,
  university TEXT,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Create public.listings table
CREATE TABLE IF NOT EXISTS public.listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL CHECK (price >= 0),
  category TEXT DEFAULT 'Ostatní' NOT NULL,
  image_url TEXT,
  status TEXT DEFAULT 'active' NOT NULL CHECK (status IN ('active', 'reserved', 'sold')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;

-- 5. Helper function: check if currently authenticated user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 6. RLS Policies for public.profiles
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile or admin can update any" ON public.profiles;
CREATE POLICY "Users can update their own profile or admin can update any"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id OR public.is_admin());

-- 7. RLS Policies for public.listings
DROP POLICY IF EXISTS "Listings are viewable by everyone" ON public.listings;
CREATE POLICY "Listings are viewable by everyone"
  ON public.listings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create listings" ON public.listings;
CREATE POLICY "Authenticated users can create listings"
  ON public.listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own listings or admins can update any" ON public.listings;
CREATE POLICY "Users can update own listings or admins can update any"
  ON public.listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete own listings or admins can delete any" ON public.listings;
CREATE POLICY "Users can delete own listings or admins can delete any"
  ON public.listings FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

-- 8. Automatic Profile Creation Trigger on Supabase Auth Signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, university, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'university', ''),
    COALESCE((NEW.raw_user_meta_data->>'is_admin')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = CASE WHEN public.profiles.full_name IS NULL OR public.profiles.full_name = '' THEN EXCLUDED.full_name ELSE public.profiles.full_name END,
    phone = CASE WHEN public.profiles.phone IS NULL OR public.profiles.phone = '' THEN EXCLUDED.phone ELSE public.profiles.phone END,
    university = CASE WHEN public.profiles.university IS NULL OR public.profiles.university = '' THEN EXCLUDED.university ELSE public.profiles.university END;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 9. Storage Bucket for Listing Images
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-images', 'listing-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage RLS Policies
DROP POLICY IF EXISTS "Listing images are publicly accessible" ON storage.objects;
CREATE POLICY "Listing images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Authenticated users can upload listing images" ON storage.objects;
CREATE POLICY "Authenticated users can upload listing images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Users can update own listing images" ON storage.objects;
CREATE POLICY "Users can update own listing images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'listing-images');

DROP POLICY IF EXISTS "Users can delete own listing images or admins" ON storage.objects;
CREATE POLICY "Users can delete own listing images or admins"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'listing-images');

-- 10. Sync existing auth.users into public.profiles (if any already exist in Auth)
INSERT INTO public.profiles (id, email, full_name, phone, university, is_admin)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', split_part(email, '@', 1)),
  COALESCE(raw_user_meta_data->>'phone', ''),
  COALESCE(raw_user_meta_data->>'university', ''),
  COALESCE((raw_user_meta_data->>'is_admin')::boolean, false)
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- Set admin role for known admin emails (adjust as needed)
UPDATE public.profiles
SET is_admin = true
WHERE email IN ('admin@mail.com', 'admin@student.cz', 'admin@bazar.cz');

-- ==============================================================================
-- 11. Optional Test Data Seeding (only inserts if matching users exist in Auth)
-- ==============================================================================
DO $$
BEGIN
  -- Insert mock listings for USER_A (if user exists)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = 'c5f6c7f6-5b59-4a57-a738-22a14676681b') THEN
    INSERT INTO public.listings (id, user_id, title, description, price, category, image_url, status)
    VALUES 
    (
      '3a7a3686-4156-4e7b-a7ae-45f21a383004',
      'c5f6c7f6-5b59-4a57-a738-22a14676681b',
      'Učebnice Matematická analýza I',
      'Skripta pro 1. ročník, perfektní stav, nepopsaná. Vhodné pro studenty informatiky i matematiky.',
      250,
      'Učebnice a skripta',
      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=800&q=80',
      'active'
    ),
    (
      '60172a43-0d47-460b-80dd-cd0a7616dcb4',
      'c5f6c7f6-5b59-4a57-a738-22a14676681b',
      'Kalkulačka Casio fx-991EX ClassWiz',
      'Vědecká kalkulačka povolená u zkoušek na většině technických vysokých škol. Se solárním napájením.',
      550,
      'Elektronika',
      'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=800&q=80',
      'active'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  -- Insert mock listings for USER_B (if user exists)
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = '3d51083f-1ca1-4cbb-ac2d-9c687773e7ea') THEN
    INSERT INTO public.listings (id, user_id, title, description, price, category, image_url, status)
    VALUES 
    (
      '49a2e2cc-acee-4b4d-a6f4-eb3fee7c9563',
      '3d51083f-1ca1-4cbb-ac2d-9c687773e7ea',
      'Kolejní lednička Goddess',
      'Malá tichá chladnička s mrazícím boxem, ideální na kolejní pokoj. Energetická třída A+.',
      1200,
      'Bydlení a nábytek',
      'https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?auto=format&fit=crop&w=800&q=80',
      'active'
    ),
    (
      'aba1f288-00ca-4b1b-b54d-9992645eb397',
      '3d51083f-1ca1-4cbb-ac2d-9c687773e7ea',
      'Monitor Dell 24" UltraSharp FHD',
      'IPS monitor s tenkými rámečky a polohovatelným stojanem. HDMI, DisplayPort kabely v ceně.',
      1800,
      'Elektronika',
      'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&w=800&q=80',
      'active'
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;
END $$;

