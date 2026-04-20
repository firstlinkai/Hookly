import { ApifyClient } from 'apify-client';
import dotenv from 'dotenv';
dotenv.config();

const client = new ApifyClient({ token: process.env.APIFY_API_TOKEN });

async function run() {
  try {
    const builds = await client.actor('curious_coder/facebook-ads-library-scraper').builds().list();
    const buildId = builds.items[0].id;
    const build = await client.build(buildId).get();
    console.log(JSON.parse(build.inputSchema));
  } catch (e) {
    console.error(e.message);
  }
}

run();
