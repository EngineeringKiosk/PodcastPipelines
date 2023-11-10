import OpenAI from 'openai'
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources'

const fetchChoices = (
    messages: ChatCompletionMessageParam[],
    openai: OpenAI
): Promise<ChatCompletion> => {
    return openai.chat.completions.create({
        messages,
        model: 'gpt-3.5-turbo',
        max_tokens: 500,
    })
}

const processPromt = async (
    prompt: string,
    chunks: string[],
    openai: OpenAI
) => {
    const promptMessage: ChatCompletionMessageParam = {
        name: 'system',
        role: 'system',
        content: prompt,
    }
    const requests = chunks.map((chunk) => {
        const messages: ChatCompletionMessageParam[] = [
            promptMessage,
            { name: 'user', role: 'user', content: chunk },
        ]
        return fetchChoices(messages, openai)
    })
    // wait for all promises to resolve and combine choices in the result
    const results = await Promise.all(requests)
    const choices = results.map((r) => r.choices).flat()
    return {
        prompt,
        choices,
        results,
    }
}

export { processPromt }
