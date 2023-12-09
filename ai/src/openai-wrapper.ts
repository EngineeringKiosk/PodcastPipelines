import OpenAI from 'openai'
import { ChatCompletion, ChatCompletionMessageParam } from 'openai/resources'
import { Utterance } from './types'

const fetchChoices = (
    messages: ChatCompletionMessageParam[],
    openai: OpenAI
): Promise<ChatCompletion> => {
    return openai.chat.completions.create({
        messages,
        model: 'gpt-4-1106-preview',
        max_tokens: 500,
    })
}

// transform to format hh:mm:ss
// output with leading zeros
const millisecondsPrettyPrint = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000)
    const minutes = Math.floor(seconds / 60)
    const hours = Math.floor(minutes / 60)

    return `${hours.toString().padStart(2, '0')}:${(minutes % 60)
        .toString()
        .padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
}

const processPrompt = async (
    prompt: string,
    userMessages: ChatCompletionMessageParam[][],
    openai: OpenAI
) => {
    const promptMessage: ChatCompletionMessageParam = {
        name: 'system',
        role: 'system',
        content: prompt,
    }
    const requests = userMessages.map((msgs) => {
        const messages: ChatCompletionMessageParam[] = [promptMessage, ...msgs]
        console.log(messages)
        return fetchChoices(messages, openai)
    })
    // wait for all promises to resolve and combine choices in the result
    const results = await Promise.allSettled(requests)
    // log errors if there are any
    results.forEach((r) => {
        if (r.status === 'rejected') {
            console.log(r.reason)
        }
    })
    // return only the choices of the fulfilled promises
    const choices = results
        .map((r) => {
            if (r.status === 'fulfilled') {
                return r.value.choices
            }
            return []
        })
        .flat()
    return {
        prompt,
        choices,
        results,
    }
}

const processPromptUtterances = async (
    prompt: string,
    utterances: Utterance[][],
    openai: OpenAI
) => {
    const messages: ChatCompletionMessageParam[][] = utterances.map((msgs) => {
        const complexMessages = msgs.map((u) => {
            const message =
                u.start && u.end
                    ? `(${millisecondsPrettyPrint(
                          u.start
                      )} - ${millisecondsPrettyPrint(u.end)}) ${u.text}`
                    : u.text
            return { name: `${u.speaker}`, role: 'user', content: message }
        })
        // just for now as the api return weird results if there are too many separated messages
        return [
            {
                name: 'user',
                role: 'user',
                content: complexMessages.map((m) => m.content).join('\n'),
            },
        ]
    })

    return processPrompt(prompt, messages, openai)
}

const processPromptText = async (
    prompt: string,
    chunks: string[],
    openai: OpenAI
) => {
    const messages: ChatCompletionMessageParam[][] = chunks.map((chunk) => {
        return [{ name: 'user', role: 'user', content: chunk }]
    })

    return processPrompt(prompt, messages, openai)
}

export { processPromptText, processPromptUtterances }
