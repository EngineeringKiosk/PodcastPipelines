import OpenAI from 'openai'
import winston from 'winston'
import { smartParseFile } from './fileReaders'
import prompts from './prompts'
import { splitTextIntoChunks, splitUtterancesIntoChunks } from './tokenizer'
import fs from 'fs'
import { processPromptText, processPromptUtterances } from './openai-wrapper'
import { Utterance, checkUtterancesFormat } from './types'

const LOGLEVEL = process.env.LOGLEVEL || 'info'
const API_LOGGING_PATH = './request_logs/'
const maxChunks = 10
const maxChunkLength = 2000

if (API_LOGGING_PATH && !fs.existsSync(API_LOGGING_PATH)) {
    fs.mkdirSync(API_LOGGING_PATH)
}

const logger = winston.createLogger({
    level: LOGLEVEL,
    //format: winston.format.json(),
    format: winston.format.simple(),
    transports: [new winston.transports.Console()],
})

logger.info(
    `Starting with loglevel ${LOGLEVEL} and inoput file ${process.argv[2]}`
)

if (process.argv.length < 3) {
    logger.error(`Usage: node ${__filename} <filepath>`)
    process.exit(1)
}

const filePath = process.argv[2]

const content = smartParseFile(filePath)

// check if field text is present and is a string
// then use it as text
const text =
    content.text && typeof content.text === 'string' ? content.text : false

if (!text) {
    logger.error('No text field found in input file')
    process.exit(1)
}

// extract utterances from content
const utterances = content.utterances as Utterance[]
// make sure utterances are in the correct format
checkUtterancesFormat(utterances)

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY as string,
})

const generateChunks = (text: string | Utterance[]) => {
    let chunks: any[] = []
    if (typeof text === 'string') {
        chunks = splitTextIntoChunks(text, maxChunkLength)
    } else {
        chunks = splitUtterancesIntoChunks(text, maxChunkLength)
    }
    if (chunks.length > maxChunks) {
        logger.info(`Limiting chunks to ${maxChunks} due to manually set limit`)
        chunks.splice(maxChunks)
    }
    return chunks
}

const getResultChoicesText = (result: any) => {
    return result.choices
        .map(
            (choice: { message: { content: string } }) => choice.message.content
        )
        .join('\n')
}

const runPrompts = async (
    promts: string | string[],
    text: string | Utterance[]
) => {
    logger.debug(`Starting processing`)

    if (typeof promts === 'string') {
        promts = [promts]
    }

    // clone promts to a stack to process them one by one
    // and use result as input for next prompt
    const promptStack = [...promts]
    const results: any[] = []

    // process prompts one by one
    while (promptStack.length > 0) {
        const prompt = promptStack.shift()
        if (!prompt) {
            logger.error('Prompt stack is empty')
            break
        }

        logger.debug(`Processing prompt: ${prompt}`)

        const lastResult =
            results.length > 0
                ? getResultChoicesText(results[results.length - 1])
                : text
        const chunks = generateChunks(lastResult)

        results.push(
            Array.isArray(text) && results.length === 0
                ? await processPromptUtterances(prompt, chunks, openai)
                : await processPromptText(prompt, chunks, openai)
        )

        // if no more prompts are left but we still have more than one chunk (so run more than one api call)
        // run the last prompt again
        // we can assume it is a reduction query (for now) if there is more than one prompt specified
        if (
            promptStack.length === 0 &&
            chunks.length > 1 &&
            promts.length > 1
        ) {
            logger.debug(
                `Running last prompt again as it seems to be a reduction query`
            )
            promptStack.push(prompt)
            logger.debug(
                `Rerunning prompt: ${prompt} as we still have ${chunks.length} chunks`
            )
        }
    }

    if (API_LOGGING_PATH) {
        const apiLogPath = `${API_LOGGING_PATH}${Date.now()}.json`
        logger.info(`Writing API log to ${apiLogPath}`)
        fs.writeFileSync(apiLogPath, JSON.stringify(results))
    }

    const lastResult = results[results.length - 1]
    if (
        !lastResult.choices ||
        !Array.isArray(lastResult.choices) ||
        lastResult.choices.length < 1
    ) {
        logger.error('No choices found in API response')
    } else {
        lastResult.choices.forEach(
            (choice: { message: { content: string } }) => {
                logger.info(choice.message.content)
            }
        )
    }
}

runPrompts(prompts.quotes, text)

// const prompt = prompts.chapters
// const utterancesChunks = splitUtterancesIntoChunks(utterances, 2000)
// logger.debug(`Split content into ${utterancesChunks.length} chunks`)

// if (utterancesChunks.length > maxChunks) {
//     logger.info(`Limiting chunks to ${maxChunks} due to manually set limit`)
//     utterancesChunks.splice(maxChunks)
// }

// runPrompts(async () =>
//     processPromptUtterances(prompt, utterancesChunks, openai)
// )
