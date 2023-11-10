const prompts = {
    quotes: `You will be provided a part of a transcript of a podcast episode.
The transcript is in german.
Your task is to find quotable sections that are short and will be used in shorts on instagram or youtube. The section should be funny or provocative.`,
    topics: `You will be provided a part of a transcript of a podcast episode.
Your task is to split the transcript into discussed topics.
List the topic heading and when it starts.
The output should be in German.`,
    shownotes: `you will be provided a transcript of a podcast episode.
the transcript is in german.
the task is to find all sentences in the transcript where an external source is mentioned or cited, such as websites, books, URLs, tools.
Often, when "shownotes" is mentioned, it is a reference to an external source.
List all sections from the transcript where hosts mentioned, cited, or references a source or entity. output in german`,
}

export default prompts
