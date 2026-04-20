import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Checkbox } from '../../components/ui/checkbox';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner';
import { generateDocx, generatePdf } from '../../lib/report-generator';

export default function ReportBuilder() {
  const { id: projectId } = useParams<{ id: string }>();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);

  // Report State
  const [selectedPostIds, setSelectedPostIds] = useState<Set<string>>(new Set());
  const [reportTitle, setReportTitle] = useState('Intelligence Report');
  const [reportDate, setReportDate] = useState(new Date().toLocaleDateString());
  const [format, setFormat] = useState<'pdf' | 'docx' | 'both'>('pdf');
  
  // Sections State
  const [sections, setSections] = useState({
    executiveSummary: true,
    competitiveLandscape: true,
    marketPerformance: true,
    hookSwipeFile: true,
    postAnalysis: true,
    audienceVoice: true,
    competitorWeakness: true,
    visualProposals: true,
    creativeBriefs: true,
    contactAbout: true,
  });

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      const { data, error } = await supabase
        .from('raw_posts')
        .select('*')
        .eq('project_id', projectId)
        .eq('generate_status', 'complete')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setPosts(data);
      }
      setLoading(false);
    };

    fetchData();
  }, [projectId]);

  const togglePost = (id: string) => {
    const newSet = new Set(selectedPostIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedPostIds(newSet);
  };

  const handleGenerate = async () => {
    if (selectedPostIds.size === 0) return;
    setIsGenerating(true);
    toast.info('Generating your report...');

    try {
      const selectedPosts = posts.filter(p => selectedPostIds.has(p.id));

      if (format === 'docx' || format === 'both') {
        await generateDocx(reportTitle, reportDate, sections, selectedPosts);
      }
      
      if (format === 'pdf' || format === 'both') {
        await generatePdf(reportTitle, reportDate, sections, selectedPosts);
      }

      toast.success('Your report has been downloaded!');
    } catch (error: any) {
      console.error('Report generation error:', error);
      toast.error(error.message || 'Error generating report');
    } finally {
      setIsGenerating(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-8">
      {/* Left Panel: Script Selection */}
      <div className="flex-1 space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Report Builder</h1>
          <p className="text-gray-500">Curate scripts and insights for your final export.</p>
        </div>

        <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border">
          <span className="font-medium">Selected: {selectedPostIds.size} scripts</span>
          {/* Add filter bar here later */}
        </div>

        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className={`transition-colors ${selectedPostIds.has(post.id) ? 'border-[#F5C518] ring-1 ring-[#F5C518]' : ''}`}>
              <CardContent className="p-4 flex gap-4">
                <div className="w-24 h-32 bg-gray-200 rounded-md overflow-hidden flex-shrink-0">
                  {post.cover_image_url ? (
                    <img src={post.cover_image_url} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm">{post.account_handle}</span>
                        <Badge variant="secondary" className="capitalize">{post.platform}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Virality: {post.virality_score}</span>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id={`include-${post.id}`} 
                            checked={selectedPostIds.has(post.id)}
                            onCheckedChange={() => togglePost(post.id)}
                          />
                          <Label htmlFor={`include-${post.id}`}>Include</Label>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="font-bold text-lg mb-1">{post.visual_theme || 'Untitled Theme'}</h3>
                    <p className="text-sm text-gray-600 line-clamp-2">{post.voiceover_theme}</p>
                  </div>
                  
                  <div className="flex justify-end">
                    <Button variant="ghost" size="sm" className="text-[#F5C518]">
                      Preview Brief &rarr;
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {posts.length === 0 && (
            <div className="text-center p-12 border-2 border-dashed rounded-lg text-gray-500">
              No completed scripts found. Go to Scraped Content to generate some!
            </div>
          )}
        </div>
      </div>

      {/* Right Panel: Report Preview (Sticky) */}
      <div className="w-full md:w-80 lg:w-96 flex-shrink-0">
        <div className="sticky top-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Report Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Report Title</Label>
                <Input 
                  value={reportTitle} 
                  onChange={(e) => setReportTitle(e.target.value)} 
                />
              </div>
              
              <div className="space-y-2">
                <Label>Report Date</Label>
                <Input 
                  value={reportDate} 
                  onChange={(e) => setReportDate(e.target.value)} 
                />
              </div>

              <div className="space-y-3">
                <Label>Included Sections</Label>
                <div className="space-y-2 border rounded-md p-3 bg-gray-50">
                  {Object.entries(sections).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`section-${key}`} 
                        checked={value as boolean}
                        onCheckedChange={(checked) => setSections(s => ({ ...s, [key]: !!checked }))}
                      />
                      <Label htmlFor={`section-${key}`} className="text-sm font-normal cursor-pointer capitalize">
                        {key.replace(/([A-Z])/g, ' $1').trim()}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Export Format</Label>
                <RadioGroup value={format || 'pdf'} onValueChange={(v: any) => setFormat(v)}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="pdf" id="pdf" />
                    <Label htmlFor="pdf">PDF</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="docx" id="docx" />
                    <Label htmlFor="docx">Word (.docx)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="both" id="both" />
                    <Label htmlFor="both">Both</Label>
                  </div>
                </RadioGroup>
              </div>

              <Button 
                className="w-full bg-[#F5C518] text-black hover:bg-[#F5C518] text-black/90" 
                disabled={selectedPostIds.size === 0 || isGenerating}
                onClick={handleGenerate}
              >
                {isGenerating ? 'Generating...' : 'Generate Report'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
