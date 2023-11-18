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

const runPrompts = async (promptFun: () => Promise<any>) => {
    logger.debug(`Starting processing`)
    const results = await promptFun()

    if (API_LOGGING_PATH) {
        const apiLogPath = `${API_LOGGING_PATH}${Date.now()}.json`
        logger.info(`Writing API log to ${apiLogPath}`)
        fs.writeFileSync(apiLogPath, JSON.stringify(results))
    }
    // check if choices is an aray and has at least one element
    if (
        !results.choices ||
        !Array.isArray(results.choices) ||
        results.choices.length < 1
    ) {
        logger.error('No choices found in API response')
    } else {
        results.choices.forEach((choice: { message: { content: string } }) => {
            logger.info(choice.message.content)
        })
    }
}

// const prompt = prompts.shownotes
// const chunks = splitTextIntoChunks(text, 2000)
// logger.debug(`Split content into ${chunks.length} chunks`)

// if (chunks.length > maxChunks) {
//     logger.info(`Limiting chunks to ${maxChunks} due to manually set limit`)
//     chunks.splice(maxChunks)
// }

// runPrompts(async () => processPromptText(prompt, chunks, openai))

const prompt = prompts.chapters
const utterancesChunks = splitUtterancesIntoChunks(utterances, 2000)
logger.debug(`Split content into ${utterancesChunks.length} chunks`)

if (utterancesChunks.length > maxChunks) {
    logger.info(`Limiting chunks to ${maxChunks} due to manually set limit`)
    utterancesChunks.splice(maxChunks)
}

runPrompts(async () =>
    processPromptUtterances(prompt, utterancesChunks, openai)
)
