import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuthStore } from '../../store/authStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Database, FolderPlus, Loader2, Play } from 'lucide-react';
import { toast } from 'sonner';

export default function Home() {
  const navigate = useNavigate();
  const { session } = useAuthStore();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    if (!session?.user?.id) return;
    
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', session.user.id)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setProjects(data);
    }
    setLoading(false);
  };

  const handleSeedData = async () => {
    if (!session?.user?.id) return;
    setIsSeeding(true);
    toast.info('Generating mock data... Please wait.');

    try {
      // 1. Create Project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: session.user.id,
          name: 'Glow Recipe Q3 Competitor Analysis',
          description: 'Tracking TikTok and IG competitors for Q3 campaign',
        })
        .select()
        .single();

      if (projectError) throw projectError;

      // 2. Create Scrape Jobs
      const { data: jobs, error: jobsError } = await supabase
        .from('scrape_jobs')
        .insert([
          {
            project_id: project.id,
            title: 'Glow Recipe TikTok Search',
            search_type: 'account_search',
            platform: 'tiktok',
            account_handle: '@glowrecipe',
            max_results: 50,
            status: 'completed',
            run: true
          },
          {
            project_id: project.id,
            title: 'Acne Treatment Keywords',
            search_type: 'keyword_search',
            platform: 'tiktok',
            keyword: 'acne treatment',
            max_results: 50,
            status: 'completed',
            run: true
          }
        ])
        .select();

      if (jobsError) throw jobsError;

      // 3. Create Raw Posts
      const mockPosts = [
        {
          project_id: project.id,
          scrape_job_id: jobs[0].id,
          external_post_id: '72839102384',
          search_type: 'account_search',
          account_handle: '@glowrecipe',
          platform: 'tiktok',
          followers_count: 1200000,
          virality_score: 8.5,
          likes_count: 45000,
          comments_count: 1200,
          caption: 'Get that glass skin glow with our Watermelon Glow Niacinamide Dew Drops! ✨🍉 #glowrecipe #glassskin #skincare',
          post_url: 'https://tiktok.com/@glowrecipe/video/72839102384',
          cover_image_url: 'https://picsum.photos/seed/glow1/400/600',
          
          analyze_post: true,
          post_analysis_status: 'complete',
          visual_hook: 'Close up of glowing, dewy skin reflecting light.',
          undeniable_proof: 'Before and after transition showing immediate hydration.',
          theme: 'Instant Gratification / Glass Skin',
          key_insight: 'Users respond highly to immediate visual texture changes rather than long-term claims.',
          hook_type: 'Visual Transformation',
          strengths: ['Strong visual hook', 'Clear product demonstration', 'Trending audio'],
          improvement_opportunities: ['Could include more diverse skin types', 'Call to action is weak'],
          lessons_to_learn: ['Prioritize texture shots', 'Keep intro under 3 seconds'],
          
          analyze_comments: true,
          comment_analysis_status: 'complete',
          comments_sentiment: 'positive',
          comments_questions: ['Does this work for oily skin?', 'Can I use this with retinol?', 'Is it non-comedogenic?'],
          comments_pain_points: ['Pilling under makeup', 'Price is too high', 'Dropper doesn\'t reach the bottom'],
          comments_summary: 'Overall highly positive, but significant concerns about pilling when layered with specific foundations.',
          comments_trend: 'Increasing questions about compatibility with other active ingredients.',
          
          generate_script: true,
          generate_status: 'complete',
          visual_theme: 'The "No-Makeup" Makeup Base',
          voiceover_theme: 'Educational: How to layer for maximum glow without pilling.',
          creative_evolution_brief: 'Objective: Address the pilling pain point while leaning into the successful "glass skin" visual hook.\n\nVisuals: Start with the same high-gloss texture shot, but immediately transition into a layering tutorial. Show the product being mixed with foundation.\n\nVoiceover: "Love the glow but hate the pill? Here is the exact way to layer Dew Drops..."\n\nCall to Action: "Save this routine for your next makeup day."'
        },
        {
          project_id: project.id,
          scrape_job_id: jobs[1].id,
          external_post_id: '9982347123',
          search_type: 'keyword_search',
          keyword: 'acne treatment',
          account_handle: '@dermdoctor',
          platform: 'tiktok',
          followers_count: 3400000,
          virality_score: 9.2,
          likes_count: 125000,
          comments_count: 3400,
          caption: 'Stop using these 3 products if you have acne! 🛑 #acne #skincare #dermatologist',
          post_url: 'https://tiktok.com/@dermdoctor/video/9982347123',
          cover_image_url: 'https://picsum.photos/seed/derm1/400/600',
          
          analyze_post: true,
          post_analysis_status: 'complete',
          visual_hook: 'Doctor in scrubs holding up popular skincare products with a red X over them.',
          undeniable_proof: 'Medical authority and scientific explanation of ingredients.',
          theme: 'Debunking / Expert Advice',
          key_insight: 'Negative hooks ("Stop doing this") perform exceptionally well in the skincare niche.',
          hook_type: 'Mistake / Warning',
          strengths: ['High authority', 'Pattern interrupt', 'Actionable advice'],
          improvement_opportunities: ['Pacing is slightly slow in the middle'],
          lessons_to_learn: ['Use negative hooks', 'Leverage authority figures'],
          
          analyze_comments: true,
          comment_analysis_status: 'complete',
          comments_sentiment: 'mixed',
          comments_questions: ['What should I use instead?', 'Is salicylic acid better than benzoyl peroxide?', 'Does diet cause acne?'],
          comments_pain_points: ['Conflicting advice from different creators', 'Products are too expensive', 'Skin purging'],
          comments_summary: 'High engagement but lots of confusion. Users are overwhelmed by the amount of conflicting skincare advice on TikTok.',
          comments_trend: 'Users are seeking simple, affordable, dermatologist-approved routines.',
          
          generate_script: true,
          generate_status: 'complete',
          visual_theme: 'The "Dumbed Down" Routine',
          voiceover_theme: 'Simplifying acne care: 3 steps, under $30.',
          creative_evolution_brief: 'Objective: Capitalize on user fatigue with complex routines by offering a simple, authoritative alternative.\n\nVisuals: Split screen. Left side: A cluttered bathroom counter. Right side: Just 3 simple products. \n\nVoiceover: "Dermatologists are begging you to stop using 10-step routines for acne. Here is the 3-step routine that actually works..."\n\nCall to Action: "Link in bio to shop the simple routine."'
        },
        {
          project_id: project.id,
          scrape_job_id: jobs[1].id,
          external_post_id: '5543219876',
          search_type: 'keyword_search',
          keyword: 'acne treatment',
          account_handle: '@skincarebyhyram',
          platform: 'tiktok',
          followers_count: 6000000,
          virality_score: 7.8,
          likes_count: 85000,
          comments_count: 2100,
          caption: 'Reacting to your crazy acne routines! 😱 #skincareroutine #reaction',
          post_url: 'https://tiktok.com/@skincarebyhyram/video/5543219876',
          cover_image_url: 'https://picsum.photos/seed/hyram1/400/600',
          
          analyze_post: true,
          post_analysis_status: 'complete',
          visual_hook: 'Exaggerated shocked facial expression in a duet format.',
          undeniable_proof: 'Real-time reaction to user-generated content.',
          theme: 'Reaction / Entertainment',
          key_insight: 'Duets and reactions to extreme routines drive high comment engagement as users debate the routine.',
          hook_type: 'Reaction',
          strengths: ['High entertainment value', 'Relatable personality', 'Encourages comments'],
          improvement_opportunities: ['Less educational value than authority posts'],
          lessons_to_learn: ['Use duet format for easy content generation', 'Expressive faces increase watch time'],
          
          analyze_comments: true,
          comment_analysis_status: 'complete',
          comments_sentiment: 'neutral',
          comments_questions: ['Can you react to my routine?', 'Why is that product bad?', 'What is your favorite cleanser?'],
          comments_pain_points: ['Damaged skin barrier from over-exfoliation', 'St. Ives Apricot Scrub trauma'],
          comments_summary: 'Audience is highly engaged with the creator\'s personality. Lots of inside jokes about specific "bad" products.',
          comments_trend: 'Users are becoming more aware of skin barrier health.',
          
          generate_script: true,
          generate_status: 'complete',
          visual_theme: 'The "Fix Your Barrier" Intervention',
          voiceover_theme: 'Empathetic: We\'ve all made skincare mistakes, here is how to fix them.',
          creative_evolution_brief: 'Objective: Pivot from reaction/shaming to empathetic repair, focusing on barrier health.\n\nVisuals: Start with a "POV: You ruined your skin barrier" text overlay. Show red, irritated skin. Transition to a soothing, milky product application.\n\nVoiceover: "If your skin burns when you apply moisturizer, stop scrolling. You\'ve damaged your barrier. Here is the 1-week reset plan..."\n\nCall to Action: "Follow for more skin barrier tips."'
        }
      ];

      const { error: postsError } = await supabase
        .from('raw_posts')
        .insert(mockPosts);

      if (postsError) throw postsError;

      toast.success('Mock data generated successfully!');
      fetchProjects(); // Refresh the list
    } catch (error: any) {
      console.error('Error seeding data:', error);
      toast.error('Failed to generate mock data. Please ensure your Supabase tables are set up correctly.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1 text-lg">Welcome to <span className="text-[#F5C518] font-medium">Hookly</span>. Select a project to get started.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : projects.length === 0 ? (
        <Card className="border-dashed border-2 bg-card/50 border-border">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center space-y-4">
            <div className="h-16 w-16 bg-[#F5C518]/10 text-[#F5C518] rounded-full flex items-center justify-center mb-4">
              <Database className="h-8 w-8" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">No Projects Yet</h2>
            <p className="text-muted-foreground max-w-md">
              It looks like your workspace is empty. You can create a new project manually, or generate some realistic mock data to see how the platform works!
            </p>
            <div className="flex gap-4 mt-4">
              <Button onClick={handleSeedData} disabled={isSeeding} className="bg-[#F5C518] text-black hover:bg-[#F5C518]/90">
                {isSeeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                Generate Mock Data
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card 
              key={project.id} 
              className="cursor-pointer border-border hover:border-[#F5C518] hover:shadow-[0_0_15px_rgba(245,197,24,0.1)] transition-all bg-card"
              onClick={() => navigate(`/dashboard/projects/${project.id}`)}
            >
              <CardHeader>
                <CardTitle className="text-foreground">{project.name}</CardTitle>
                <CardDescription className="line-clamp-2 text-muted-foreground">{project.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Database className="mr-2 h-4 w-4" />
                  Created {new Date(project.created_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>
          ))}
          
          <Card 
            className="cursor-pointer border-dashed border-2 border-border hover:border-[#F5C518]/50 hover:bg-card/80 transition-colors flex flex-col items-center justify-center min-h-[200px] text-muted-foreground hover:text-[#F5C518]"
            onClick={() => toast.info('Create project modal would open here')}
          >
            <FolderPlus className="h-8 w-8 mb-2" />
            <span className="font-medium">New Project</span>
          </Card>
        </div>
      )}
    </div>
  );
}

