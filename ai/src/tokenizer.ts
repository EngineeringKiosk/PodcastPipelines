const guessNumberOfTokens = (text: string): number => {
    // based on https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them
    // 1 token = 4 characters, 100 tokens = 75 words
    return text.split(' ').length * 1.33
}

const splitTextIntoChunks = (text: string, maxTokens: number): string[] => {
    // split text into sentences by splitting at ., !, ? and a space or newline afterwards
    const sentences = text.split(/(?<=[.!?])\s+/)
    const chunks: string[] = []
    let currentChunk = ''
    for (const sentence of sentences) {
        if (guessNumberOfTokens(currentChunk + sentence) > maxTokens) {
            chunks.push(currentChunk)
            currentChunk = ''
        }
        currentChunk += '. ' + sentence
    }
    chunks.push(currentChunk)
    return chunks
}

export { guessNumberOfTokens, splitTextIntoChunks }
