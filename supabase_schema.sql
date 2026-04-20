-- Create Projects Table
CREATE TABLE IF NOT EXISTS projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT
);

-- Create Scrape Jobs Table
CREATE TABLE IF NOT EXISTS scrape_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  search_type TEXT NOT NULL,
  platform TEXT NOT NULL,
  account_handle TEXT,
  keyword TEXT,
  max_results INTEGER DEFAULT 50,
  status TEXT DEFAULT 'pending',
  run BOOLEAN DEFAULT false
);

-- Create Raw Posts Table
CREATE TABLE IF NOT EXISTS raw_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE NOT NULL,
  scrape_job_id UUID REFERENCES scrape_jobs(id) ON DELETE CASCADE NOT NULL,
  external_post_id TEXT,
  search_type TEXT,
  account_handle TEXT,
  keyword TEXT,
  platform TEXT,
  followers_count INTEGER,
  virality_score NUMERIC,
  likes_count INTEGER,
  comments_count INTEGER,
  caption TEXT,
  post_url TEXT,
  cover_image_url TEXT,
  
  -- Post Analysis
  analyze_post BOOLEAN DEFAULT false,
  post_analysis_status TEXT DEFAULT 'pending',
  visual_hook TEXT,
  undeniable_proof TEXT,
  theme TEXT,
  key_insight TEXT,
  hook_type TEXT,
  strengths JSONB,
  improvement_opportunities JSONB,
  lessons_to_learn JSONB,
  
  -- Comment Analysis
  analyze_comments BOOLEAN DEFAULT false,
  comment_analysis_status TEXT DEFAULT 'pending',
  comments_sentiment TEXT,
  comments_questions JSONB,
  comments_pain_points JSONB,
  comments_summary TEXT,
  comments_trend TEXT,
  
  -- Script Generation
  generate_script BOOLEAN DEFAULT false,
  generate_status TEXT DEFAULT 'pending',
  visual_theme TEXT,
  voiceover_theme TEXT,
  creative_evolution_brief TEXT
);

-- Disable Row Level Security temporarily for testing so the mock data generator works flawlessly
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs DISABLE ROW LEVEL SECURITY;
ALTER TABLE raw_posts DISABLE ROW LEVEL SECURITY;
