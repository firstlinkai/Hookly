import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../../components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../../components/ui/sheet';
import { ScrollArea } from '../../components/ui/scroll-area';

export default function VisualProposal() {
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
        .eq('generate_status', 'complete')
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
      accessorKey: 'external_post_id',
      header: 'ID',
    },
    {
      accessorKey: 'search_type',
      header: 'Search',
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
      header: 'User',
    },
    {
      accessorKey: 'visual_theme',
      header: 'Visual Theme',
    },
    {
      accessorKey: 'voiceover_theme',
      header: 'Voiceover 1 Theme',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">Visual Proposal</h1>
        <p className="text-gray-500">Review generated visual and voiceover themes.</p>
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
            setTimeout(() => setIsDrawerOpen(true), 0);
          }}
        />
      )}

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px] sm:max-w-none">
          <SheetHeader className="mb-6">
            <SheetTitle>Visual Proposal Details</SheetTitle>
            <SheetDescription>
              Based on {selectedPost?.account_handle}'s post
            </SheetDescription>
          </SheetHeader>
          
          <ScrollArea className="h-[calc(100vh-120px)] pr-4">
            {selectedPost && (
              <div className="space-y-8 pb-8">
                <div>
                  <h4 className="text-sm font-medium text-gray-500">Visual Theme</h4>
                  <p className="mt-1 text-gray-900 font-medium">{selectedPost.visual_theme || '-'}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Voiceover Theme</h4>
                  <p className="mt-1 text-gray-900 font-medium">{selectedPost.voiceover_theme || '-'}</p>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-gray-500">Full Visual Proposal</h4>
                  <div className="mt-2 text-gray-900 whitespace-pre-wrap bg-gray-50 p-4 rounded-md border">
                    {selectedPost.visual_proposal || 'No proposal generated yet.'}
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
