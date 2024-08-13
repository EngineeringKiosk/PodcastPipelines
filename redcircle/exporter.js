require('dotenv').config();
const axios = require('axios');
const fs = require('fs');

// Load bearer token from environment variable
const BEARER_TOKEN = process.env.BEARER_TOKEN;

// Calculate current time in seconds and one year ago in seconds
const currentTime = Math.floor(Date.now() / 1000);

// Define URLs
const statsUrl = `https://app.redcircle.com/api/stats/downloads?arbitraryTimeRange=1639090800%2C${currentTime}&bucketTerms=download.episodeUUID&interval=1y&isUnique=true&showUUID=0ecfdfd7-fda1-4c3d-9515-476727f9df5e&timezone=Europe%2FVienna`;
const episodesUrl = 'https://app.redcircle.com/api/shows/0ecfdfd7-fda1-4c3d-9515-476727f9df5e/episodes';

// Define headers
const headers = {
  'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0',
  'Accept': '*/*',
  'Accept-Language': 'en-GB,en;q=0.8,de;q=0.6,de-AT;q=0.4,nl;q=0.2',
  'Accept-Encoding': 'gzip, deflate, br, zstd',
  'Referer': 'https://app.redcircle.com/stats',
  'Authorization': `Bearer ${BEARER_TOKEN}`
};

// Fetch data from the given URL
async function fetchData(url) {
  try {
    const response = await axios.get(url, { headers });
    return response.data;
  } catch (error) {
    console.error(`Error fetching data from ${url}:`, error.message);
    return null;
  }
}

// Combine data from episodes and download stats
async function processStatsAndEpisodes() {
  const episodes = await fetchData(episodesUrl);
  const downloadStats = await fetchData(statsUrl);

  if (!episodes || !downloadStats) {
    console.error('Failed to fetch episodes or download stats.');
    return;
  }

  // Map download counts by episode UUID
  const downloadCountMap = downloadStats.reduce((map, stat) => {
    if (map[stat.pathValues[1]] === undefined) {
      map[stat.pathValues[1]] = 0;
    }
    map[stat.pathValues[1]] += stat.count;
    return map;
  }, {});

  // Combine episodes with their download counts
  const result = episodes.map(episode => {
    return {
      uuid: episode.uuid,
      title: episode.title,
      guid: episode.guid,
      count: downloadCountMap[episode.uuid] || 0,
      publishedAt: new Date(episode.publishedAt * 1000).toISOString(),
      statsTill: new Date(currentTime * 1000).toISOString(),
    };
  });

  // Write the result to a JSON file
  const nowFileString = (new Date()).toISOString().replace(/:/g, '-');
  fs.writeFileSync(`episode_stats_${nowFileString}.json`, JSON.stringify(result, null, 2));
  console.log(`Wrote episode stats to episode_stats_${nowFileString}.json`);
}

// Execute the main function
processStatsAndEpisodes();
