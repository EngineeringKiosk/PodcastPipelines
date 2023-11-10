import OpenAI from 'openai'
import winston from 'winston'
import { smartParseFile } from './fileReaders'
import prompts from './prompts'
import { splitTextIntoChunks } from './tokenizer'
import fs from 'fs'
import { processPromt } from './openai-wrapper'

const LOGLEVEL = process.env.LOGLEVEL || 'info'
const API_LOGGING_PATH = './request_logs/'

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
const prompt = prompts.shownotes

const chunks = splitTextIntoChunks(content, 2000)
logger.debug(`Split content into ${chunks.length} chunks`)

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY as string,
})

const main = async () => {
    logger.debug(`Starting processing of ${chunks.length} chunks`)
    const results = await processPromt(prompt, chunks, openai)

    if (API_LOGGING_PATH) {
        const apiLogPath = `${API_LOGGING_PATH}${Date.now()}.json`
        logger.info(`Writing API log to ${apiLogPath}`)
        fs.writeFileSync(apiLogPath, JSON.stringify(results))
    }
}

main()

// interface Utterance {
//     text: string
//     speaker: string
//     // Add other properties as needed
// }

// interface Content {
//     utterances: Utterance[]
//     // Add other properties as needed
// }

// const filepath: string | null = process.argv[2] || null

// if (!filepath) {
//     console.log(`Usage: node ${__filename} <filepath>`)
//     process.exit(1)
// }

// const content: Content = JSON.parse(fs.readFileSync(filepath, 'utf8'))
// const utterances: Utterance[] = content.utterances

// const getUtterancesIndex = (
//     utterances: Utterance[],
//     tokenCounterMax: number
// ): number => {
//     let tokenCounter = 0
//     let utterancesIndex = 0
//     while (
//         tokenCounter < tokenCounterMax &&
//         utterancesIndex < utterances.length
//     ) {
//         tokenCounter += guessNumberOfTokens(utterances[utterancesIndex].text)
//         if (tokenCounter > tokenCounterMax) {
//             break
//         } else {
//             utterancesIndex++
//         }
//     }
//     return utterancesIndex
// }

// interface Message {
//     name: string
//     role: string
//     content: string
// }

// const convertUtterancesToMessages = (utterances: Utterance[]): Message[] => {
//     return utterances.map((u) => {
//         return { name: `Speaker${u.speaker}`, role: 'user', content: u.text }
//     })
// }

// const fetchChoices = async (messages: Message[]) => {
//     const completion = await openai.chat.completions.create({
//         messages,
//         model: 'gpt-3.5-turbo',
//         max_tokens: 500,
//     })

//     return completion
// }

// // split utterances into chunks of 2000 tokens
// const utterancesChunks: Utterance[][] = []
// let currentChunk: Utterance[] = utterances

// while (currentChunk.length > 0) {
//     const utterancesIndex = getUtterancesIndex(currentChunk, 2000)
//     utterancesChunks.push(currentChunk.slice(0, utterancesIndex))
//     currentChunk = currentChunk.slice(utterancesIndex)
// }

// async function main() {
//     const choices = []

//     for (const chunk of utterancesChunks) {
//         const messages = [
//             {
//                 role: 'system',
//                 content: `You will be provided a part of a transcript of a podcast episode. Your task is to write a short summary of this part of the episode.

//   - The input test is in German, the summary should be in German as well.
//   - The summary should contain as many details as possible.
//     `,
//             },
//             ...convertUtterancesToMessages(chunk),
//         ]
//         choices.push(await fetchChoices(messages))
//     }

//     console.log(JSON.stringify(choices))
// }

//main();
