import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { DataTable } from '../../components/ui/data-table';
import { ColumnDef } from '@tanstack/react-table';
import { Badge } from '../../components/ui/badge';
import { Check, ExternalLink, RefreshCw } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { toast } from 'sonner';

export default function SearchHistory() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) return;

    const fetchData = async () => {
      const { data: jobs, error } = await supabase
        .from('scrape_jobs')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (!error && jobs) {
        setData(jobs);
      }
      setLoading(false);
    };

    fetchData();

    // Subscribe to realtime updates
    const subscription = supabase
      .channel('scrape_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scrape_jobs',
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
  }, [projectId]);

  const handleSync = async (e: React.MouseEvent, jobId: string) => {
    e.stopPropagation();
    toast.info('Syncing job status...');
    try {
      const response = await fetch('/api/runs/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: jobId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to sync');
      
      if (data.status === 'completed') {
        toast.success(`Job completed! Found ${data.posts_found} posts.`);
      } else if (data.status === 'failed') {
        toast.error('Job failed on Apify.');
      } else {
        toast.info(`Job is still ${data.status}...`);
      }
    } catch (error: any) {
      console.error('Error syncing job:', error);
      toast.error(error.message || 'Failed to sync job');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      accessorKey: 'title',
      header: 'Search Title',
      cell: ({ row }) => (
        <div className="font-medium text-[#F5C518] hover:underline flex items-center">
          {row.getValue('title')}
          <ExternalLink className="ml-2 h-3 w-3" />
        </div>
      ),
    },
    {
      accessorKey: 'search_type',
      header: 'Search',
      cell: ({ row }) => {
        const type = row.getValue('search_type') as string;
        const colors: Record<string, string> = {
          keyword_search: 'bg-green-100 text-green-800',
          account_search: 'bg-blue-100 text-blue-800',
          ad_search: 'bg-yellow-100 text-yellow-800',
        };
        const labels: Record<string, string> = {
          keyword_search: 'Keyword',
          account_search: 'Account',
          ad_search: 'Ad Library',
        };
        return (
          <Badge variant="outline" className={colors[type] || ''}>
            {labels[type] || type}
          </Badge>
        );
      },
    },
    {
      accessorKey: 'platform',
      header: 'Platform',
      cell: ({ row }) => {
        const platform = row.getValue('platform') as string;
        return <Badge variant="secondary" className="capitalize">{platform}</Badge>;
      },
    },
    {
      accessorKey: 'keyword',
      header: 'Keywords',
    },
    {
      accessorKey: 'account_handle',
      header: 'Account',
    },
    {
      accessorKey: 'run',
      header: 'Run',
      cell: ({ row }) => {
        return row.getValue('run') ? <Check className="h-4 w-4 text-green-600" /> : null;
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.getValue('status') as string;
        const colors: Record<string, string> = {
          pending: 'bg-gray-100 text-gray-800',
          running: 'bg-yellow-100 text-yellow-800',
          completed: 'bg-green-100 text-green-800',
          failed: 'bg-red-100 text-red-800',
        };
        return (
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className={colors[status] || ''}>
              {status}
            </Badge>
            {status === 'running' && (
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6" 
                onClick={(e) => handleSync(e, row.original.id)}
                title="Check Apify Status"
              >
                <RefreshCw className="h-3 w-3 text-gray-500" />
              </Button>
            )}
          </div>
        );
      },
    },
    {
      accessorKey: 'max_results',
      header: 'Max Results',
    },
    {
      accessorKey: 'date_range',
      header: 'Date Range',
      cell: ({ row }) => {
        const range = row.getValue('date_range') as string;
        return <span className="capitalize">{range?.replace(/_/g, ' ')}</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">Search History</h1>
          <p className="text-gray-500">Track and manage your past search requests.</p>
        </div>
        <Button 
          onClick={() => navigate(`/dashboard/projects/${projectId}/search`)}
          className="bg-[#F5C518] text-black hover:bg-[#F5C518] text-black/90"
        >
          New Search
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center p-8">Loading...</div>
      ) : (
        <DataTable 
          columns={columns} 
          data={data} 
          onRowClick={(row) => navigate(`/dashboard/projects/${projectId}/scraped-content?job=${row.id}`)}
        />
      )}
    </div>
  );
}
