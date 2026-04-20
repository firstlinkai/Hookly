import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { supabaseAdmin } from './src/lib/backend-supabase.js';
import { startScrapeJob, getDatasetItems, getRunStatus } from './src/services/apifyService.js';
import { analyzePost, analyzeComments, generateScripts } from './src/services/aiService.js';

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes for internal orchestration
  app.post('/api/runs/trigger', async (req, res) => {
    const { job_id, project_id } = req.body;
    console.log(`Triggering scrape job ${job_id} for project ${project_id}`);
    
    try {
      // 1. Fetch job details from Supabase
      const { data: job, error } = await supabaseAdmin
        .from('scrape_jobs')
        .select('*')
        .eq('id', job_id)
        .single();

      if (error || !job) throw new Error('Job not found');

      // 2. Update status to running
      await supabaseAdmin
        .from('scrape_jobs')
        .update({ status: 'running', started_at: new Date().toISOString() })
        .eq('id', job_id);

      // 3. Start Apify Actor
      const webhookUrl = `${process.env.APP_URL}/api/webhooks/apify?job_id=${job_id}`;
      const run = await startScrapeJob(
        job_id,
        job.platform,
        job.search_type,
        job.keyword,
        job.account_handle,
        job.max_results,
        webhookUrl
      );

      // 4. Save Apify run ID
      await supabaseAdmin
        .from('scrape_jobs')
        .update({ apify_run_id: run.id })
        .eq('id', job_id);

      res.json({ success: true, job_id, apify_run_id: run.id });
    } catch (error: any) {
      console.error('Error triggering scrape:', error);
      await supabaseAdmin
        .from('scrape_jobs')
        .update({ status: 'failed', error_message: error.message })
        .eq('id', job_id);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/runs/sync', async (req, res) => {
    const { job_id } = req.body;
    console.log(`Syncing scrape job ${job_id}`);
    
    try {
      // 1. Fetch job details
      const { data: job } = await supabaseAdmin.from('scrape_jobs').select('*').eq('id', job_id).single();
      if (!job) throw new Error('Job not found');
      if (!job.apify_run_id) throw new Error('No Apify run ID associated with this job');
      if (job.status === 'completed') return res.json({ success: true, status: 'completed', message: 'Already completed' });

      // 2. Check Apify run status
      const run = await getRunStatus(job.apify_run_id);
      if (!run) throw new Error('Run not found on Apify');

      if (run.status === 'SUCCEEDED' || run.status === 'TIMED-OUT' || run.status === 'ABORTED') {
        const datasetId = run.defaultDatasetId;
        const items = await getDatasetItems(datasetId);
        
        // Transform and insert into raw_posts
        const postsToInsert = items.map((item: any) => {
          // Skip error items
          if (item.error) return null;

          // Facebook Ads Library mapping
          if (item.ad_archive_id) {
            return {
              project_id: job.project_id,
              scrape_job_id: job.id,
              search_type: job.search_type,
              keyword: job.keyword,
              platform: job.platform,
              account_handle: item.page_name || item.snapshot?.page_name || job.account_handle,
              external_post_id: item.ad_archive_id,
              post_url: item.ad_library_url || item.snapshot?.link_url || item.url,
              caption: item.snapshot?.body?.text || item.snapshot?.cards?.[0]?.body || item.snapshot?.title || '',
              likes_count: 0,
              comments_count: 0,
              views_count: 0,
              followers_count: item.snapshot?.page_like_count || 0,
              virality_score: 0,
              published_at: item.start_date_formatted ? new Date(item.start_date_formatted).toISOString() : new Date().toISOString(),
            };
          }

          const likes = item.diggCount || item.likesCount || item.likes || 0;
          const comments = item.commentCount || item.commentsCount || item.comments || 0;
          const shares = item.shareCount || item.sharesCount || item.shares || 0;
          const followers = item.authorMeta?.fans || item.ownerFollowers || item.followersCount || item.followers || 0;
          
          let viralityScore = 0;
          if (followers > 0) {
            const rawScore = ((shares * 10) + (comments * 5) + (likes * 1)) / followers * 100;
            // Normalize to 30-99 range using logarithmic scale to handle massive outliers
            const logScore = Math.log10(rawScore + 1);
            const maxLog = Math.log10(50000 + 1); // Assuming 50000 is a massive viral outlier
            viralityScore = 30 + (69 * Math.min(logScore / maxLog, 1));
          }

          return {
            project_id: job.project_id,
            scrape_job_id: job.id,
            search_type: job.search_type,
            keyword: job.keyword,
            platform: job.platform,
            account_handle: item.authorMeta?.name || item.ownerUsername || item.username || item.pageName || job.account_handle,
            external_post_id: item.id || item.shortCode || item.postId,
            post_url: item.webVideoUrl || item.url || item.postUrl,
            caption: item.text || item.caption || item.message || '',
            likes_count: likes,
            comments_count: comments,
            views_count: item.playCount || item.viewCount || item.views || 0,
            followers_count: followers,
            virality_score: Number(viralityScore.toFixed(2)),
            published_at: item.createTimeISO || (item.timestamp ? new Date(item.timestamp).toISOString() : null) || item.publishedAt || item.date || new Date().toISOString(),
          };
        }).filter((p: any) => p !== null); // Remove nulls

        if (postsToInsert.length > 0) {
          // Delete existing posts for this job to avoid duplicates if webhook fired partially
          await supabaseAdmin.from('raw_posts').delete().eq('scrape_job_id', job.id);
          await supabaseAdmin.from('raw_posts').insert(postsToInsert);
        }

        // Update job status
        await supabaseAdmin
          .from('scrape_jobs')
          .update({ 
            status: 'completed', 
            completed_at: new Date().toISOString(),
            posts_found: postsToInsert.length
          })
          .eq('id', job_id);

        return res.json({ success: true, status: 'completed', posts_found: postsToInsert.length });
      } else if (run.status === 'FAILED' || run.status === 'ABORTED' || run.status === 'TIMED-OUT') {
        await supabaseAdmin
          .from('scrape_jobs')
          .update({ status: 'failed', error_message: `Apify run ${run.status}` })
          .eq('id', job_id);
        return res.json({ success: true, status: 'failed' });
      } else {
        return res.json({ success: true, status: run.status.toLowerCase() });
      }
    } catch (error: any) {
      console.error('Error syncing job:', error);
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/runs/trigger-post-analysis', async (req, res) => {
    const { post_id } = req.body;
    console.log(`Triggering post analysis for ${post_id}`);
    
    try {
      await supabaseAdmin
        .from('raw_posts')
        .update({ post_analysis_status: 'in_progress' })
        .eq('id', post_id);

      const { data: post } = await supabaseAdmin.from('raw_posts').select('*').eq('id', post_id).single();
      
      // Run analysis in background
      analyzePost(post).then(async (analysis) => {
        await supabaseAdmin
          .from('raw_posts')
          .update({
            ...analysis,
            raw_post_analysis: analysis,
            post_analysis_status: 'complete'
          })
          .eq('id', post_id);
      }).catch(async (err) => {
        console.error('Post analysis failed:', err);
        await supabaseAdmin.from('raw_posts').update({ post_analysis_status: 'error' }).eq('id', post_id);
      });

      res.json({ success: true, post_id });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/runs/trigger-comment-analysis', async (req, res) => {
    const { post_id } = req.body;
    console.log(`Triggering comment analysis for ${post_id}`);
    
    try {
      await supabaseAdmin
        .from('raw_posts')
        .update({ comment_analysis_status: 'in_progress' })
        .eq('id', post_id);

      const { data: post } = await supabaseAdmin.from('raw_posts').select('*').eq('id', post_id).single();
      
      // Mock fetching comments (in reality, you'd fetch from Apify or DB)
      const mockComments = [{ text: "Great post!" }, { text: "I disagree." }];
      
      // Run analysis in background
      analyzeComments(post, mockComments).then(async (analysis) => {
        await supabaseAdmin
          .from('raw_posts')
          .update({
            ...analysis,
            raw_comment_analysis: analysis,
            comment_analysis_status: 'complete'
          })
          .eq('id', post_id);
      }).catch(async (err) => {
        console.error('Comment analysis failed:', err);
        await supabaseAdmin.from('raw_posts').update({ comment_analysis_status: 'error' }).eq('id', post_id);
      });

      res.json({ success: true, post_id });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  app.post('/api/runs/trigger-generate', async (req, res) => {
    const { post_id } = req.body;
    console.log(`Triggering script generation for ${post_id}`);
    
    try {
      await supabaseAdmin
        .from('raw_posts')
        .update({ generate_status: 'in_progress' })
        .eq('id', post_id);

      const { data: post } = await supabaseAdmin.from('raw_posts').select('*').eq('id', post_id).single();
      
      // Run generation in background
      generateScripts(post, post.raw_post_analysis).then(async (scripts) => {
        // Insert generated scripts
        for (let i = 0; i < scripts.length; i++) {
          await supabaseAdmin.from('generated_scripts').insert({
            project_id: post.project_id,
            post_id: post.id,
            script_number: i + 1,
            ...scripts[i]
          });
        }
        
        await supabaseAdmin
          .from('raw_posts')
          .update({ generate_status: 'complete' })
          .eq('id', post_id);
      }).catch(async (err) => {
        console.error('Script generation failed:', err);
        await supabaseAdmin.from('raw_posts').update({ generate_status: 'error' }).eq('id', post_id);
      });

      res.json({ success: true, post_id });
    } catch (error: any) {
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Apify Webhook Handler
  app.post('/api/webhooks/apify', async (req, res) => {
    const { job_id } = req.query;
    const payload = req.body;
    
    console.log(`Received Apify webhook for job ${job_id}`);
    
    try {
      if (!job_id) throw new Error('Missing job_id');
      
      const datasetId = payload.resource?.defaultDatasetId;
      if (!datasetId) throw new Error('Missing datasetId in webhook payload');

      // Fetch job details
      const { data: job } = await supabaseAdmin.from('scrape_jobs').select('*').eq('id', job_id).single();
      if (!job) throw new Error('Job not found');

      // Fetch data from Apify
      const items = await getDatasetItems(datasetId);
      
      // Transform and insert into raw_posts
      const postsToInsert = items.map((item: any) => {
        if (item.error) return null;

        // Facebook Ads Library mapping
        if (item.ad_archive_id) {
          return {
            project_id: job.project_id,
            scrape_job_id: job.id,
            search_type: job.search_type,
            keyword: job.keyword,
            platform: job.platform,
            account_handle: item.page_name || item.snapshot?.page_name || job.account_handle,
            external_post_id: item.ad_archive_id,
            post_url: item.ad_library_url || item.snapshot?.link_url || item.url,
            caption: item.snapshot?.body?.text || item.snapshot?.cards?.[0]?.body || item.snapshot?.title || '',
            likes_count: 0,
            comments_count: 0,
            views_count: 0,
            followers_count: item.snapshot?.page_like_count || 0,
            virality_score: 0,
            published_at: item.start_date_formatted ? new Date(item.start_date_formatted).toISOString() : new Date().toISOString(),
          };
        }

        const likes = item.diggCount || item.likesCount || item.likes || 0;
        const comments = item.commentCount || item.commentsCount || item.comments || 0;
        const shares = item.shareCount || item.sharesCount || item.shares || 0;
        const followers = item.authorMeta?.fans || item.ownerFollowers || item.followersCount || item.followers || 0;
        
        let viralityScore = 0;
        if (followers > 0) {
          const rawScore = ((shares * 10) + (comments * 5) + (likes * 1)) / followers * 100;
          // Normalize to 30-99 range using logarithmic scale to handle massive outliers
          const logScore = Math.log10(rawScore + 1);
          const maxLog = Math.log10(50000 + 1); // Assuming 50000 is a massive viral outlier
          viralityScore = 30 + (69 * Math.min(logScore / maxLog, 1));
        }

        return {
          project_id: job.project_id,
          scrape_job_id: job.id,
          search_type: job.search_type,
          keyword: job.keyword,
          platform: job.platform,
          account_handle: item.authorMeta?.name || item.ownerUsername || item.username || item.pageName || job.account_handle,
          external_post_id: item.id || item.shortCode || item.postId,
          post_url: item.webVideoUrl || item.url || item.postUrl,
          caption: item.text || item.caption || item.message || '',
          likes_count: likes,
          comments_count: comments,
          views_count: item.playCount || item.viewCount || item.views || 0,
          followers_count: followers,
          virality_score: Number(viralityScore.toFixed(2)),
          published_at: item.createTimeISO || (item.timestamp ? new Date(item.timestamp).toISOString() : null) || item.publishedAt || item.date || new Date().toISOString(),
        };
      }).filter((p: any) => p !== null);

      if (postsToInsert.length > 0) {
        await supabaseAdmin.from('raw_posts').insert(postsToInsert);
      }

      // Update job status
      await supabaseAdmin
        .from('scrape_jobs')
        .update({ 
          status: 'completed', 
          completed_at: new Date().toISOString(),
          posts_found: postsToInsert.length
        })
        .eq('id', job_id);

      res.json({ success: true });
    } catch (error: any) {
      console.error('Webhook processing failed:', error);
      if (job_id) {
        await supabaseAdmin
          .from('scrape_jobs')
          .update({ status: 'failed', error_message: error.message })
          .eq('id', job_id);
      }
      res.status(500).json({ success: false, error: error.message });
    }
  });

  // Report Generation
  app.post('/api/reports/generate', (req, res) => {
    const { project_id, selected_post_ids, sections_included, report_title, format } = req.body;
    console.log(`Generating report for project ${project_id}`);
    console.log(`Format: ${format}, Posts: ${selected_post_ids.length}`);
    
    // In a real app, this would:
    // 1. Fetch all data for the selected posts from Supabase
    // 2. If PDF: Render HTML template and pass to Puppeteer
    // 3. If DOCX: Use docx library to build document
    // 4. Upload to Supabase Storage
    // 5. Return signed URLs
    
    // Mock response for MVP
    setTimeout(() => {
      res.json({ 
        success: true, 
        pdf_url: format === 'pdf' || format === 'both' ? 'https://example.com/report.pdf' : null,
        docx_url: format === 'docx' || format === 'both' ? 'https://example.com/report.docx' : null,
      });
    }, 2000);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
