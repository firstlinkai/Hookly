import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';

import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../../components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Switch } from '../../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';

const searchSchema = z.object({
  title: z.string().min(1, 'Search Title is required'),
  search_type: z.enum(['keyword_search', 'account_search', 'ad_search']),
  platform: z.enum(['tiktok', 'facebook', 'instagram']),
  keyword: z.string().optional(),
  account_handle: z.string().optional(),
  max_results: z.number().min(10),
  country: z.string().optional(),
  date_range: z.enum(['last_7_days', 'last_30_days', 'last_90_days', 'all_time']).optional(),
  run: z.boolean(),
  account_email: z.string().email('Valid email is required'),
}).refine((data) => {
  if ((data.search_type === 'keyword_search' || data.search_type === 'ad_search') && !data.keyword) {
    return false;
  }
  if (data.search_type === 'account_search' && !data.account_handle) {
    return false;
  }
  return true;
}, {
  message: "Keyword or Account Handle is required based on search type",
  path: ["keyword"], // Attach error to keyword field generally
});

type SearchFormValues = z.infer<typeof searchSchema>;

export default function SearchRequests() {
  const { id: projectId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<SearchFormValues>({
    resolver: zodResolver(searchSchema),
    defaultValues: {
      search_type: 'keyword_search',
      platform: 'tiktok',
      max_results: 10,
      run: false,
      date_range: 'last_30_days',
      country: 'US',
    },
  });

  const searchType = form.watch('search_type');
  const runToggle = form.watch('run');

  const onSubmit = async (data: SearchFormValues) => {
    if (!projectId) return;
    setIsSubmitting(true);

    try {
      // 1. If run is true, check for active jobs
      if (data.run) {
        const { data: activeJobs, error: activeJobsError } = await supabase
          .from('scrape_jobs')
          .select('id')
          .eq('project_id', projectId)
          .eq('status', 'running')
          .limit(1);

        if (activeJobsError) throw activeJobsError;
        
        if (activeJobs && activeJobs.length > 0) {
          toast.error('A scrape job is already running for this project. Please wait for it to finish.');
          setIsSubmitting(false);
          return;
        }
      }

      // 2. Insert into scrape_jobs
      const { data: jobData, error: insertError } = await supabase
        .from('scrape_jobs')
        .insert({
          project_id: projectId,
          title: data.title,
          search_type: data.search_type,
          platform: data.platform,
          keyword: data.search_type !== 'account_search' ? data.keyword : null,
          account_handle: data.search_type === 'account_search' ? data.account_handle : null,
          max_results: data.max_results,
          country: data.country,
          date_range: data.date_range,
          run: data.run,
          account_email: data.account_email,
          status: data.run ? 'running' : 'pending',
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // 3. Trigger webhook if run is true
      if (data.run && jobData) {
        const response = await fetch('/api/runs/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ job_id: jobData.id, project_id: projectId }),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to trigger run webhook');
        }
      }

      toast.success('Search request created successfully');
      navigate(`/dashboard/projects/${projectId}/search-history`);
    } catch (error: any) {
      console.error('Error creating search request:', error);
      toast.error(error.message || 'Failed to create search request');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">New Search Request</h1>
        <p className="text-gray-500">Configure parameters to scrape competitor ads and posts.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Search Parameters</CardTitle>
          <CardDescription>Define what content you want to collect.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            {/* Search Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Search Title <span className="text-red-500">*</span></Label>
              <Input 
                id="title" 
                placeholder="e.g., Q3 Skincare Competitors" 
                {...form.register('title')} 
              />
              {form.formState.errors.title && (
                <p className="text-sm text-red-500">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Search Type */}
              <div className="space-y-3">
                <Label>Search Type <span className="text-red-500">*</span></Label>
                <RadioGroup 
                  value={searchType || 'keyword_search'}
                  onValueChange={(val) => form.setValue('search_type', val as any)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="keyword_search" id="keyword_search" />
                    <Label htmlFor="keyword_search" className="font-normal">Keyword Search</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="account_search" id="account_search" />
                    <Label htmlFor="account_search" className="font-normal">Account Search</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ad_search" id="ad_search" />
                    <Label htmlFor="ad_search" className="font-normal">Ad Search (Meta Library)</Label>
                  </div>
                </RadioGroup>
              </div>

              {/* Platform */}
              <div className="space-y-3">
                <Label>Platform <span className="text-red-500">*</span></Label>
                <RadioGroup 
                  value={form.watch('platform') || 'tiktok'}
                  onValueChange={(val) => form.setValue('platform', val as any)}
                  className="flex flex-col space-y-1"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tiktok" id="tiktok" />
                    <Label htmlFor="tiktok" className="font-normal">TikTok</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="facebook" id="facebook" />
                    <Label htmlFor="facebook" className="font-normal">Facebook</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="instagram" id="instagram" />
                    <Label htmlFor="instagram" className="font-normal">Instagram</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Keyword / Account Handle */}
            <div className="space-y-2">
              <Label htmlFor="keyword_handle">
                {searchType === 'account_search' ? 'Account Handle' : 'Keyword'} <span className="text-red-500">*</span>
              </Label>
              <Input 
                id="keyword_handle" 
                placeholder={searchType === 'account_search' ? '@glowrecipe' : 'acne treatment'} 
                {...form.register(searchType === 'account_search' ? 'account_handle' : 'keyword')} 
              />
              {form.formState.errors.keyword && (
                <p className="text-sm text-red-500">{form.formState.errors.keyword.message}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Max Results */}
              <div className="space-y-2">
                <Label htmlFor="max_results">Max Results</Label>
                <Input 
                  id="max_results" 
                  type="number" 
                  min={10}
                  {...form.register('max_results', { valueAsNumber: true })} 
                />
              </div>

              {/* Country */}
              <div className="space-y-2">
                <Label>Country</Label>
                <Select 
                  defaultValue={form.getValues('country')} 
                  onValueChange={(val) => form.setValue('country', val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range */}
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Select 
                  defaultValue={form.getValues('date_range')} 
                  onValueChange={(val) => form.setValue('date_range', val as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="last_7_days">Last 7 Days</SelectItem>
                    <SelectItem value="last_30_days">Last 30 Days</SelectItem>
                    <SelectItem value="last_90_days">Last 90 Days</SelectItem>
                    <SelectItem value="all_time">All Time</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Account Email */}
            <div className="space-y-2">
              <Label htmlFor="account_email">Operator Account Email <span className="text-red-500">*</span></Label>
              <Input 
                id="account_email" 
                type="email"
                placeholder="operator@agency.com" 
                {...form.register('account_email')} 
              />
              <p className="text-xs text-gray-500">The account used by the scraper actor.</p>
              {form.formState.errors.account_email && (
                <p className="text-sm text-red-500">{form.formState.errors.account_email.message}</p>
              )}
            </div>

            {/* Run Toggle */}
            <div className="flex flex-row items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <Label className="text-base">Run Immediately</Label>
                <p className="text-sm text-gray-500">
                  Ensure no other searches are active for this project.
                </p>
              </div>
              <Switch
                checked={runToggle}
                onCheckedChange={(checked) => form.setValue('run', checked)}
              />
            </div>

            <div className="flex justify-end space-x-4">
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                Clear Form
              </Button>
              <Button type="submit" className="bg-[#F5C518] text-black hover:bg-[#F5C518] text-black/90" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : (runToggle ? 'Submit & Run' : 'Save Request')}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
