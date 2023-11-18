const prompts = {
    quotes: `You will be provided a part of a transcript of a podcast episode.
The transcript is in german.
Your task is to find quotable sections that are short and will be used in shorts on instagram or youtube. The section should be funny or provocative.`,
    chapters: `You will be provided a part of a transcript of a podcast episode.
Your task is to split the transcript into chapters based on the topics discussed.
Every chapter should be formulated in less than 10 words.
List every identified chapter in the format "<start time> - <end time>: <topic>" in German.
`,
    shownotes: `You will be provided a part of a transcript of a podcast episode.
Finde alle Abschnitte im Podcast-Transkript, in denen externe Quellen oder Entitäten, wie Websites, Bücher, URLs, Personen oder Tools,
erwähnt oder zitiert werden. Achte besonders auf Hinweise wie "Shownotes",
die oft auf externe Quellen hinweisen. Gib eine Liste von gefundenen Quellen und Entitäten aus.`,
}

export default prompts
