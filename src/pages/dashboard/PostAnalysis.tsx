import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { ExternalLink } from 'lucide-react';
import { Badge } from '../../components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet';
import { ScrollArea } from '../../components/ui/scroll-area';

export default function PostAnalysis() {
  const { id: projectId } = useParams<{ id: string }>();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<any | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      const { data: posts, error } = await supabase
        .from('raw_posts')
        .select('*')
        .eq('project_id', projectId)
        .eq('post_analysis_status', 'complete')
        .order('created_at', { ascending: false });

      if (!error && posts) {
        setData(posts);
      }
      setLoading(false);
    };

    fetchData();
  }, [projectId]);

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'keyword',
      header: 'Keyword',
    },
    {
      accessorKey: 'account_handle',
      header: 'User',
    },
    {
      accessorKey: 'virality_score',
      header: 'Virality Score',
      cell: ({ row }) => {
        const val = row.getValue('virality_score') as number;
        return val ? <span className="font-bold text-[#F5C518]">{val}</span> : '-';
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
      accessorKey: 'visual_hook',
      header: 'Visual Hook',
      cell: ({ row }) => {
        const val = row.getValue('visual_hook') as string;
        return <div className="max-w-[200px] truncate" title={val}>{val || '-'}</div>;
      }
    },
    {
      accessorKey: 'undeniable_proof',
      header: 'Undeniable Proof',
      cell: ({ row }) => {
        const val = row.getValue('undeniable_proof') as string;
        return <div className="max-w-[200px] truncate" title={val}>{val || '-'}</div>;
      }
    },
    {
      accessorKey: 'theme',
      header: 'Theme',
    },
    {
      accessorKey: 'key_insight',
      header: 'Key Insight',
      cell: ({ row }) => {
        const val = row.getValue('key_insight') as string;
        return <div className="max-w-[200px] truncate" title={val}>{val || '-'}</div>;
      }
    },
    {
      accessorKey: 'hook_type',
      header: 'Hook Type',
    },
    {
      accessorKey: 'comments_sentiment',
      header: 'Comments Sentiment',
      cell: ({ row }) => {
        const status = row.original.comment_analysis_status;
        if (status === 'insufficient_data') {
          return <span className="text-gray-400 italic">Insufficient Dataset</span>;
        }
        if (status !== 'complete') {
          return <span className="text-gray-400 italic">Pending</span>;
        }
        
        const val = row.getValue('comments_sentiment') as string;
        const colors: Record<string, string> = {
          positive: 'bg-green-100 text-green-800',
          negative: 'bg-red-100 text-red-800',
          mixed: 'bg-yellow-100 text-yellow-800',
          neutral: 'bg-gray-100 text-gray-800',
        };
        return val ? <Badge variant="outline" className={colors[val] || ''}>{val}</Badge> : '-';
      }
    },
    {
      accessorKey: 'comments_summary',
      header: 'Comments Summary',
      cell: ({ row }) => {
        const status = row.original.comment_analysis_status;
        if (status === 'insufficient_data') {
          return <span className="text-gray-400 italic">Insufficient Dataset</span>;
        }
        if (status !== 'complete') {
          return <span className="text-gray-400 italic">Pending</span>;
        }
        const val = row.getValue('comments_summary') as string;
        return <div className="max-w-[200px] truncate" title={val}>{val || '-'}</div>;
      }
    },
    {
      accessorKey: 'comments_pain_points',
      header: 'Comments Pain Points',
      cell: ({ row }) => {
        const val = row.getValue('comments_pain_points') as string[];
        return <div className="max-w-[200px] truncate" title={val?.join(', ')}>{val?.join(', ') || '-'}</div>;
      }
    },
    {
      accessorKey: 'strengths',
      header: 'Strengths',
      cell: ({ row }) => {
        const val = row.getValue('strengths') as string[];
        return <div className="max-w-[200px] truncate" title={val?.join(', ')}>{val?.join(', ') || '-'}</div>;
      }
    },
    {
      accessorKey: 'improvement_opportunities',
      header: 'Improvement Opportunities',
      cell: ({ row }) => {
        const val = row.getValue('improvement_opportunities') as string[];
        return <div className="max-w-[200px] truncate" title={val?.join(', ')}>{val?.join(', ') || '-'}</div>;
      }
    },
    {
      accessorKey: 'lessons_to_learn',
      header: 'Lessons to Learn',
      cell: ({ row }) => {
        const val = row.getValue('lessons_to_learn') as string[];
        return <div className="max-w-[200px] truncate" title={val?.join(', ')}>{val?.join(', ') || '-'}</div>;
      }
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Analysis Results</h1>
        <p className="text-gray-500">Review AI-generated insights from post content and audience comments.</p>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">Loading...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={data} 
          defaultGrouping={['keyword']}
          onRowClick={(row) => {
            setSelectedPost(row);
            // Use setTimeout to prevent the click event from bubbling up and immediately closing the Sheet
            setTimeout(() => setIsDrawerOpen(true), 0);
          }}
        />
      )}

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-none">
          <SheetHeader className="mb-6">
            <SheetTitle>Analysis Details</SheetTitle>
            <SheetDescription>
              {selectedPost?.account_handle} • {selectedPost?.platform}
              {selectedPost?.post_url && (
                <a href={selectedPost.post_url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline flex items-center mt-1">
                  <ExternalLink className="h-3 w-3 mr-1"/> View Original Post
                </a>
              )}
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-120px)] pr-4">
            {selectedPost && (
              <div className="space-y-8 pb-8">
                {/* Post Content Analysis */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Content Analysis</h3>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Virality Score</h4>
                    <p className="mt-1 font-bold text-[#F5C518] text-xl">{selectedPost.virality_score || '-'}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Theme</h4>
                    <p className="mt-1 text-gray-900">{selectedPost.theme || '-'}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Key Insight</h4>
                    <p className="mt-1 text-gray-900">{selectedPost.key_insight || '-'}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Hook Type</h4>
                    <p className="mt-1 text-gray-900">{selectedPost.hook_type || '-'}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Visual Hook</h4>
                    <p className="mt-1 text-gray-900">{selectedPost.visual_hook || '-'}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Undeniable Proof</h4>
                    <p className="mt-1 text-gray-900">{selectedPost.undeniable_proof || '-'}</p>
                  </div>
                </div>

                {/* Comments Analysis */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Audience & Comments</h3>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Sentiment</h4>
                    <div className="mt-1">
                      {selectedPost.comments_sentiment ? (
                        <Badge variant="outline" className="capitalize">{selectedPost.comments_sentiment}</Badge>
                      ) : '-'}
                    </div>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Summary</h4>
                    <p className="mt-1 text-gray-900">{selectedPost.comments_summary || '-'}</p>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Pain Points</h4>
                    <ul className="mt-1 list-disc pl-5 space-y-1">
                      {selectedPost.comments_pain_points?.map((point: string, i: number) => (
                        <li key={i} className="text-gray-900">{point}</li>
                      )) || <span className="text-gray-900">-</span>}
                    </ul>
                  </div>
                </div>

                {/* Strategic Takeaways */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg border-b pb-2">Strategic Takeaways</h3>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Strengths</h4>
                    <ul className="mt-1 list-disc pl-5 space-y-1">
                      {selectedPost.strengths?.map((point: string, i: number) => (
                        <li key={i} className="text-gray-900">{point}</li>
                      )) || <span className="text-gray-900">-</span>}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Improvement Opportunities</h4>
                    <ul className="mt-1 list-disc pl-5 space-y-1">
                      {selectedPost.improvement_opportunities?.map((point: string, i: number) => (
                        <li key={i} className="text-gray-900">{point}</li>
                      )) || <span className="text-gray-900">-</span>}
                    </ul>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium text-gray-500">Lessons to Learn</h4>
                    <ul className="mt-1 list-disc pl-5 space-y-1">
                      {selectedPost.lessons_to_learn?.map((point: string, i: number) => (
                        <li key={i} className="text-gray-900">{point}</li>
                      )) || <span className="text-gray-900">-</span>}
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </ScrollArea>
        </SheetContent>
      </Sheet>
    </div>
  );
}
