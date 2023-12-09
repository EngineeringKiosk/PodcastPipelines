const prompts = {
    quotes: [
        `You will be provided a part of a transcript of a podcast episode.
Your task is to find quotable sections that are short and can be used in shorts on instagram or youtube.
The sections should adhere to one or more of the following properties:
- funny
- provocative
- exlainatory
- surprising
- controversial
- emotional
- shocking
- new
Output the list of sections in german.`,
        `You will be provided a list of quotes.
Your task is to provide a list of the 10 most interesting quotes in German.`,
    ],
    chapters: [
        `You will be provided a part of a transcript of a podcast episode.
Your task is to split the transcript into chapters based on the topics discussed.
Every chapter should be formulated in less than 10 words in German.
List every identified chapter in the format "<start time> - <end time>: <topic>" in German.
`,
        `You will be provided a list of chapters of chunks of a podcast episode.
Your task is combine all chapters to a short list of chapters that cover all topics discussed in the episode.
`,
    ],
    shownotes: `You will be provided a part of a transcript of a podcast episode.
Finde alle Abschnitte im Podcast-Transkript, in denen externe Quellen oder Entitäten, wie Websites, Bücher, URLs, Personen oder Tools,
erwähnt oder zitiert werden. Achte besonders auf Hinweise wie "Shownotes",
die oft auf externe Quellen hinweisen. Gib eine Liste von gefundenen Quellen und Entitäten aus.`,
}

export default prompts
