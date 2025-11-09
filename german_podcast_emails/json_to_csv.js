const { readFileSync, writeFileSync } = require("fs");

const data = JSON.parse(readFileSync("emails_with_authors.json", "utf-8"));

let csv = '"Podcast Name","RSS Feed","Emails","Author Names"\n';

data.forEach((podcast) => {
  const podcastName = podcast.podcastName;
  const rssFeed = podcast.rssFeed;
  const emails = podcast.emails?.join(" ") || "";
  const authorNames = podcast.authors?.map(a => a.name || "").filter(n => n).join(" ") || "";
  
  csv += `"${podcastName}","${rssFeed}","${emails}","${authorNames}"\n`;
});

writeFileSync("emails.csv", csv);
