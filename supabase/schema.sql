-- FirstlinkAI Database Schema (PRD v1.0 + v2.0 Delta)
-- Run this in your Supabase SQL Editor

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- USERS & ORGANIZATIONS
-- ============================================================================
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    full_name TEXT,
    company_name TEXT,
    avatar_url TEXT,
    role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('admin', 'client')),
    timezone TEXT NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SUBSCRIPTIONS
-- ============================================================================
CREATE TABLE public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    stripe_subscription_id TEXT UNIQUE,
    stripe_price_id TEXT,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'growth', 'agency')),
    status TEXT NOT NULL DEFAULT 'trialing' CHECK (status IN ('trialing', 'active', 'past_due', 'canceled', 'paused')),
    trial_ends_at TIMESTAMPTZ,
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- CLIENT PROJECTS
-- ============================================================================
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    niche TEXT NOT NULL,
    brand_website TEXT,
    brand_description TEXT,
    target_audience TEXT,
    usp TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- COMPETITOR WATCHLIST
-- ============================================================================
CREATE TABLE public.competitors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    brand_name TEXT NOT NULL,
    platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'facebook', 'instagram')),
    account_handle TEXT,
    account_url TEXT,
    scrape_type TEXT NOT NULL DEFAULT 'account' CHECK (scrape_type IN ('account', 'keyword')),
    keywords TEXT[],
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_scraped_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SCRAPE JOBS (Updated per PRD v2.0)
-- ============================================================================
CREATE TABLE public.scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    competitor_id UUID REFERENCES public.competitors(id),
    
    -- Search request fields
    title TEXT NOT NULL,
    search_type TEXT NOT NULL CHECK (search_type IN ('keyword_search', 'account_search', 'ad_search')),
    platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'facebook', 'instagram')),
    keyword TEXT,
    account_handle TEXT,
    max_results INT NOT NULL DEFAULT 10,
    country TEXT,
    date_range TEXT CHECK (date_range IN ('last_7_days', 'last_30_days', 'last_90_days', 'all_time')),
    run BOOLEAN NOT NULL DEFAULT FALSE,
    account_email TEXT,
    
    -- Execution
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    apify_run_id TEXT,
    posts_found INT DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RAW POSTS (Updated per PRD v2.0 - Denormalized)
-- ============================================================================
CREATE TABLE public.raw_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    scrape_job_id UUID REFERENCES public.scrape_jobs(id),
    competitor_id UUID REFERENCES public.competitors(id),
    
    -- Search context
    search_type TEXT NOT NULL CHECK (search_type IN ('keyword_search', 'account_search', 'ad_search')),
    keyword TEXT,
    account_email TEXT,
    
    -- Account / creator info
    platform TEXT NOT NULL CHECK (platform IN ('tiktok', 'facebook', 'instagram')),
    account_handle TEXT,
    followers_count BIGINT DEFAULT 0,
    
    -- Post metadata
    external_post_id TEXT,
    post_type TEXT CHECK (post_type IN ('video', 'image', 'carousel', 'text')),
    post_url TEXT,
    photo_url TEXT,
    video_url TEXT,
    cover_image_url TEXT,
    caption TEXT,
    hashtags TEXT[],
    published_at TIMESTAMPTZ,
    
    -- Engagement metrics
    views_count BIGINT DEFAULT 0,
    likes_count BIGINT DEFAULT 0,
    comments_count BIGINT DEFAULT 0,
    shares_count BIGINT DEFAULT 0,
    bookmarks_count BIGINT DEFAULT 0,
    virality_score DECIMAL(5,2),
    
    -- Ad-specific
    is_ad BOOLEAN DEFAULT FALSE,
    ad_library_id TEXT,
    ad_start_date TIMESTAMPTZ,
    ad_duration_days INT,
    
    -- ANALYSIS TRIGGER FLAGS
    analyze_post BOOLEAN NOT NULL DEFAULT FALSE,
    analyze_comments BOOLEAN NOT NULL DEFAULT FALSE,
    generate_script BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- PIPELINE STATUS PER POST
    post_analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (post_analysis_status IN ('pending', 'in_progress', 'complete', 'error')),
    comment_analysis_status TEXT NOT NULL DEFAULT 'pending' CHECK (comment_analysis_status IN ('pending', 'in_progress', 'complete', 'error', 'insufficient_data')),
    generate_status TEXT NOT NULL DEFAULT 'pending' CHECK (generate_status IN ('pending', 'in_progress', 'complete', 'error')),
    
    -- POST ANALYSIS OUTPUT FIELDS
    key_insight TEXT,
    visual_hook TEXT,
    undeniable_proof TEXT,
    theme TEXT,
    hook_type TEXT,
    hook_score INT CHECK (hook_score BETWEEN 1 AND 10),
    content_format TEXT,
    primary_emotion TEXT,
    problem_stated TEXT,
    solution_presented TEXT,
    call_to_action TEXT,
    brand_wedge TEXT,
    target_demographic TEXT,
    tone TEXT,
    estimated_retention DECIMAL(5,2),
    ad_fatigue_signal BOOLEAN DEFAULT FALSE,
    trend_score INT CHECK (trend_score BETWEEN 1 AND 10),
    strengths TEXT[],
    improvement_opportunities TEXT[],
    lessons_to_learn TEXT[],
    
    -- COMMENT ANALYSIS OUTPUT FIELDS
    comments_summary TEXT,
    comments_sentiment TEXT,
    comments_sentiment_breakdown JSONB,
    comments_questions TEXT[],
    comments_pain_points TEXT[],
    comments_trend TEXT[],
    audience_language TEXT[],
    trust_signals TEXT[],
    top_takes TEXT[],
    
    -- SCRIPT / CREATIVE OUTPUT FIELDS
    visual_theme TEXT,
    voiceover_theme TEXT,
    creative_evolution_brief TEXT,
    
    -- Raw AI output
    raw_post_analysis JSONB,
    raw_comment_analysis JSONB,
    raw_script_output JSONB,
    
    -- Meta
    scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for raw_posts
CREATE INDEX idx_raw_posts_project_id ON public.raw_posts(project_id);
CREATE INDEX idx_raw_posts_post_analysis_status ON public.raw_posts(post_analysis_status);
CREATE INDEX idx_raw_posts_comment_status ON public.raw_posts(comment_analysis_status);
CREATE INDEX idx_raw_posts_generate_status ON public.raw_posts(generate_status);
CREATE INDEX idx_raw_posts_virality ON public.raw_posts(virality_score DESC);
CREATE INDEX idx_raw_posts_analyze_post_flag ON public.raw_posts(analyze_post) WHERE analyze_post = TRUE;
CREATE INDEX idx_raw_posts_analyze_comments_flag ON public.raw_posts(analyze_comments) WHERE analyze_comments = TRUE;
CREATE INDEX idx_raw_posts_generate_flag ON public.raw_posts(generate_script) WHERE generate_script = TRUE;

-- ============================================================================
-- REPORT RUNS (Manual exports per PRD v2.0)
-- ============================================================================
CREATE TABLE public.report_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    run_number INT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'assembling', 'completed', 'failed')),
    trigger_type TEXT NOT NULL DEFAULT 'manual_export' CHECK (trigger_type IN ('scheduled', 'manual', 'manual_export')),
    
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    pdf_url TEXT,
    pdf_file_path TEXT,
    docx_url TEXT,
    docx_file_path TEXT,
    pdf_generated_at TIMESTAMPTZ,
    
    error_message TEXT,
    error_stage TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- GENERATED SCRIPTS (Detail table)
-- ============================================================================
CREATE TABLE public.generated_scripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_run_id UUID REFERENCES public.report_runs(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.raw_posts(id) ON DELETE CASCADE,
    
    script_number INT NOT NULL,
    concept_name TEXT NOT NULL,
    inspiration_source TEXT,
    
    hook_visual TEXT NOT NULL,
    hook_voiceover TEXT NOT NULL,
    body_script TEXT NOT NULL,
    body_visual_notes TEXT NOT NULL,
    proof_element TEXT,
    cta_text TEXT NOT NULL,
    cta_visual TEXT,
    
    hook_variant_a TEXT,
    hook_variant_b TEXT,
    hook_variant_c TEXT,
    
    why_it_works TEXT NOT NULL,
    target_emotion TEXT,
    estimated_format TEXT,
    recommended_platform TEXT,
    recommended_length TEXT,
    
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'in_production', 'live')),
    client_rating INT CHECK (client_rating BETWEEN 1 AND 5),
    client_notes TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- HOOK INTELLIGENCE BANK
-- ============================================================================
CREATE TABLE public.hook_intelligence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    post_id UUID REFERENCES public.raw_posts(id),
    
    hook_text TEXT NOT NULL,
    hook_type TEXT NOT NULL,
    platform TEXT NOT NULL,
    competitor_brand TEXT,
    virality_score DECIMAL(5,2),
    engagement_rate DECIMAL(5,4),
    ad_duration_days INT,
    still_running BOOLEAN DEFAULT TRUE,
    
    pattern_family TEXT,
    trend_status TEXT DEFAULT 'active' CHECK (trend_status IN ('emerging', 'active', 'saturated')),
    
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scrape_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.raw_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hook_intelligence ENABLE ROW LEVEL SECURITY;

-- Profiles: users see only their own
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects: users see only their own projects
CREATE POLICY "Users can CRUD own projects" ON public.projects FOR ALL USING (auth.uid() = user_id);

-- Child tables: scoped to project ownership
CREATE POLICY "Clients see own project competitors" ON public.competitors FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);
CREATE POLICY "Clients see own project scrape_jobs" ON public.scrape_jobs FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);
CREATE POLICY "Clients see own project raw_posts" ON public.raw_posts FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);
CREATE POLICY "Clients see own project report_runs" ON public.report_runs FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);
CREATE POLICY "Clients see own project generated_scripts" ON public.generated_scripts FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);
CREATE POLICY "Clients see own project hook_intelligence" ON public.hook_intelligence FOR ALL USING (
    project_id IN (SELECT id FROM public.projects WHERE user_id = auth.uid())
);

-- ============================================================================
-- TRIGGERS
-- ============================================================================
-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at_profiles BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_projects BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_raw_posts BEFORE UPDATE ON public.raw_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at_generated_scripts BEFORE UPDATE ON public.generated_scripts FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Calculate virality score on insert/update of raw_posts
CREATE OR REPLACE FUNCTION calculate_virality_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.virality_score = LEAST(100, (
        (COALESCE(NEW.likes_count, 0) * 0.2) +
        (COALESCE(NEW.comments_count, 0) * 0.4) +
        (COALESCE(NEW.shares_count, 0) * 0.3) +
        (COALESCE(NEW.views_count, 0) * 0.0001) +
        (COALESCE(NEW.ad_duration_days, 0) * 0.5)
    ) / 10);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calc_virality BEFORE INSERT OR UPDATE ON public.raw_posts
FOR EACH ROW EXECUTE FUNCTION calculate_virality_score();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', 'client');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
