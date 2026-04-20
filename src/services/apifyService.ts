import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';

dotenv.config();

const apifyToken = process.env.APIFY_API_TOKEN;
const client = new ApifyClient({ token: apifyToken });

export async function startScrapeJob(
  jobId: string,
  platform: string,
  searchType: string,
  keyword: string | null,
  accountHandle: string | null,
  maxResults: number,
  webhookUrl: string
) {
  if (!apifyToken) {
    throw new Error('APIFY_API_TOKEN is not set');
  }

  let actorId = '';
  let input: any = {};

  // Map platforms and search types to Apify actors
  if (platform === 'instagram') {
    if (searchType === 'account_search' && accountHandle) {
      actorId = 'apify/instagram-scraper';
      input = { usernames: [accountHandle], resultsLimit: maxResults };
    } else if (searchType === 'keyword_search' && keyword) {
      actorId = 'apify/instagram-hashtag-scraper';
      input = { hashtags: [keyword], resultsLimit: maxResults };
    }
  } else if (platform === 'facebook') {
    if (searchType === 'account_search' && accountHandle) {
      actorId = 'apify/facebook-search-scraper';
      input = { startUrls: [{ url: `https://www.facebook.com/${accountHandle}` }], resultsLimit: maxResults };
    } else if ((searchType === 'keyword_search' || searchType === 'ad_search') && keyword) {
      actorId = 'curious_coder/facebook-ads-library-scraper';
      input = { 
        urls: [{ url: `https://www.facebook.com/ads/library/?active_status=all&ad_type=all&country=ALL&q=${encodeURIComponent(keyword)}` }], 
        count: maxResults,
        limitPerSource: maxResults
      };
    }
  } else if (platform === 'tiktok') {
    actorId = 'clockworks/tiktok-scraper';
    if (searchType === 'account_search' && accountHandle) {
      input = { profiles: [accountHandle], resultsPerPage: maxResults };
    } else if (searchType === 'keyword_search' && keyword) {
      input = { hashtags: [keyword], resultsPerPage: maxResults };
    }
  } else {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  // Start the actor
  const run = await client.actor(actorId).start(input, {
    timeoutSecs: 120, // Hard timeout of 2 minutes to prevent runaway costs
    webhooks: [
      {
        eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.TIMED_OUT', 'ACTOR.RUN.ABORTED'],
        requestUrl: webhookUrl,
        payloadTemplate: '{"resource":{{resource}}}'
      }
    ]
  });

  return run;
}

export async function getRunStatus(runId: string) {
  if (!apifyToken) {
    throw new Error('APIFY_API_TOKEN is not set');
  }
  const run = await client.run(runId).get();
  return run;
}

export async function getDatasetItems(datasetId: string) {
  if (!apifyToken) {
    throw new Error('APIFY_API_TOKEN is not set');
  }
  const { items } = await client.dataset(datasetId).listItems();
  return items;
}
