interface Utterance {
    speaker: string
    text: string
    start?: number
    end?: number
}

const checkUtterancesFormat = (utterances: any[]) => {
    utterances.forEach((u) => {
        if (!u.speaker || typeof u.speaker !== 'string') {
            throw new Error('Utterance must have a speaker')
        }
        if (!u.text || typeof u.text !== 'string') {
            throw new Error('Utterance must have a text')
        }
        if (u.start && typeof u.start !== 'number') {
            throw new Error('Utterance start must be a number')
        }
        if (u.end && typeof u.end !== 'number') {
            throw new Error('Utterance end must be a number')
        }
    })
    return true
}

export { checkUtterancesFormat, Utterance }
