-- Create tables for TheoAI

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT auth.uid(),
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  "securityQuestion" TEXT,
  "securityAnswer" TEXT,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Songs table
CREATE TABLE IF NOT EXISTS songs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  lyrics TEXT NOT NULL,
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Backgrounds table
CREATE TABLE IF NOT EXISTS backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  "isDefault" BOOLEAN DEFAULT FALSE,
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Recordings table
CREATE TABLE IF NOT EXISTS recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  type TEXT NOT NULL,
  data TEXT, -- Base64 encoded or path to storage
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  "defaultBgUrl" TEXT,
  "bibleTranslation" TEXT DEFAULT 'kjv'
);

-- Slides table
CREATE TABLE IF NOT EXISTS slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL, -- Public URL from Storage
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- Media table (Pics and Videos)
CREATE TABLE IF NOT EXISTS media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  type TEXT NOT NULL, -- 'image' or 'video'
  "userId" UUID REFERENCES users(id) ON DELETE CASCADE,
  "createdAt" TIMESTAMPTZ DEFAULT NOW()
);

-- NOTE ON STORAGE:
-- You must manually create two buckets in the Supabase Storage Dashboard:
-- 1. 'slides' - Make it PUBLIC so slides can be viewed via URL.
-- 2. 'recordings' - (Optional if you move recording data to storage later).

-- SEED DATA (Optional)
-- Add the default admin user (ID matches lib/auth.ts)
-- Replace 'hashed_password' with a bcrypt hash if you want to seed it manually,
-- but the app will automatically upsert this on first admin login.
-- INSERT INTO users (id, username, password) 
-- VALUES ('00000000-0000-0000-0000-000000000000', 'admin', 'hashed_password')
-- ON CONFLICT (username) DO NOTHING;

-- Enable RLS (Optional, but recommended for production)
-- For now, since we use supabaseAdmin (Service Role), we bypass RLS.
-- If you want to use the public client, you'll need to add policies.
