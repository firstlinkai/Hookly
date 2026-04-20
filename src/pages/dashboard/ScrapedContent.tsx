import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { ExternalLink } from 'lucide-react';

export default function ScrapedContent() {
  const { id: projectId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('job');
  
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      let query = supabase
        .from('raw_posts')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (jobId) {
        query = query.eq('scrape_job_id', jobId);
      }

      const { data: posts, error } = await query;

      if (!error && posts) {
        setData(posts);
      }
      setLoading(false);
    };

    fetchData();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('raw_posts_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'raw_posts',
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setData((prev) => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setData((prev) => prev.map((item) => (item.id === payload.new.id ? payload.new : item)));
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [projectId, jobId]);

  const handleToggle = async (postId: string, field: string, currentValue: boolean) => {
    const newValue = !currentValue;
    if (!newValue) return; // Only handle turning it ON
    
    // Optimistic update
    setData((prev) => prev.map(item => item.id === postId ? { 
      ...item, 
      [field]: newValue,
      ...(field === 'analyze_post' ? { 
        analyze_comments: true, 
        post_analysis_status: 'in_progress', 
        comment_analysis_status: 'in_progress' 
      } : {}),
      ...(field === 'generate_script' ? {
        generate_status: 'in_progress'
      } : {})
    } : item));

    try {
      if (field === 'analyze_post') {
        // Trigger post analysis
        await fetch('/api/runs/trigger-post-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: postId })
        });
        // Trigger comment analysis
        await fetch('/api/runs/trigger-comment-analysis', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: postId })
        });
      } else if (field === 'generate_script') {
        // Trigger script generation
        await fetch('/api/runs/trigger-generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ post_id: postId })
        });
      }
    } catch (error) {
      console.error('Error triggering analysis:', error);
      // Revert optimistic update by refetching
      const { data } = await supabase.from('raw_posts').select('*').eq('project_id', projectId!).order('created_at', { ascending: false });
      if (data) setData(data);
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'search_type',
      header: 'Contents',
      cell: ({ row }) => {
        const type = row.getValue('search_type') as string;
        return <Badge variant="outline" className="capitalize">{type?.replace('_', ' ')}</Badge>;
      },
    },
    {
      accessorKey: 'keyword',
      header: 'Keyword',
    },
    {
      accessorKey: 'account_handle',
      header: 'Account',
    },
    {
      accessorKey: 'followers_count',
      header: 'Followers',
      cell: ({ row }) => {
        const val = row.getValue('followers_count') as number;
        return val ? new Intl.NumberFormat('en-US', { notation: "compact", compactDisplay: "short" }).format(val) : '-';
      }
    },
    {
      accessorKey: 'virality_score',
      header: 'Virality',
      cell: ({ row }) => {
        const val = row.getValue('virality_score') as number;
        return val ? <span className="font-bold text-[#F5C518]">{val}</span> : '-';
      }
    },
    {
      accessorKey: 'likes_count',
      header: 'Likes',
      cell: ({ row }) => {
        const val = row.getValue('likes_count') as number;
        return val ? new Intl.NumberFormat('en-US', { notation: "compact" }).format(val) : '-';
      }
    },
    {
      accessorKey: 'comments_count',
      header: 'Comments',
      cell: ({ row }) => {
        const val = row.getValue('comments_count') as number;
        return val ? new Intl.NumberFormat('en-US', { notation: "compact" }).format(val) : '-';
      }
    },
    {
      accessorKey: 'caption',
      header: 'Caption',
      cell: ({ row }) => {
        const val = row.getValue('caption') as string;
        return <div className="max-w-[200px] truncate" title={val}>{val}</div>;
      }
    },
    {
      accessorKey: 'post_url',
      header: 'Post URL',
      cell: ({ row }) => {
        const val = row.getValue('post_url') as string;
        return val ? <a href={val} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center"><ExternalLink className="h-3 w-3 mr-1"/> Link</a> : '-';
      }
    },
    {
      accessorKey: 'analyze_post',
      header: 'Analyze Content & Comments',
      cell: ({ row }) => {
        const isAnalyzing = row.original.post_analysis_status === 'in_progress' || row.original.comment_analysis_status === 'in_progress';
        const isAnalyzed = row.original.post_analysis_status === 'complete' && row.original.comment_analysis_status === 'complete';
        
        return (
          <Button 
            variant={isAnalyzed ? "secondary" : "default"}
            size="sm"
            disabled={isAnalyzing || isAnalyzed}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(row.original.id, 'analyze_post', row.original.analyze_post);
            }}
          >
            {isAnalyzing ? 'Analyzing...' : isAnalyzed ? 'Analyzed' : 'Analyze'}
          </Button>
        );
      },
    },
    {
      accessorKey: 'post_analysis_status',
      header: 'Analysis Status',
      cell: ({ row }) => {
        const postStatus = row.original.post_analysis_status as string;
        const commentStatus = row.original.comment_analysis_status as string;
        
        // Show a combined status
        let displayStatus = postStatus;
        if (postStatus === 'complete' && commentStatus === 'in_progress') {
          displayStatus = 'analyzing comments...';
        } else if (postStatus === 'complete' && commentStatus === 'complete') {
          displayStatus = 'complete';
        }
        
        return <Badge variant="secondary">{displayStatus}</Badge>;
      }
    },
    {
      accessorKey: 'generate_script',
      header: 'Generate',
      cell: ({ row }) => {
        const isGenerating = row.original.generate_status === 'in_progress';
        const isGenerated = row.original.generate_status === 'complete';
        
        return (
          <Button 
            variant={isGenerated ? "secondary" : "default"}
            size="sm"
            disabled={isGenerating || isGenerated}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle(row.original.id, 'generate_script', row.original.generate_script);
            }}
          >
            {isGenerating ? 'Generating...' : isGenerated ? 'Generated' : 'Generate'}
          </Button>
        );
      },
    },
    {
      accessorKey: 'generate_status',
      header: 'Generate Status',
      cell: ({ row }) => {
        const status = row.original.generate_status as string;
        return <Badge variant="secondary">{status}</Badge>;
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Scraped Content</h1>
        <p className="text-gray-500">Review raw posts and trigger AI analysis pipelines.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">Loading...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={data} 
          defaultGrouping={['keyword']}
        />
      )}
    </div>
  );
}
