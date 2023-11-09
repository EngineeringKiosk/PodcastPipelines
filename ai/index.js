// This code is for v4 of the openai package: npmjs.com/package/openai
const OpenAIApi = require('openai');
const fs = require('fs')

const openai = new OpenAIApi({
  apiKey: process.env.OPENAI_API_KEY,
});

// read first command line param as file path
const filepath = process.argv[2] || null

if (!filepath) {
  console.log(`Usage: node ${__filename} <filepath>`)
  process.exit(1)
}

const guessNUmberOfTokens = (text) => {
  // based on https://help.openai.com/en/articles/4936856-what-are-tokens-and-how-to-count-them
  // 1 token = 4 characters, 100tokens = 75 words
  return text.split(" ").length * 1.33
}

// {
//   "text": "Leute im Tech-Bereich werden oft als Knowledge-Worker bezeichnet. Und es gibt auch noch diesen Mythos, dass im Team jeder alles wissen muss, damit jeder alles übernehmen kann. Bis heute bin ich mir gar nicht sicher, ob dieser Zustand jemals erreicht wurde. Dennoch ist das Teilen von Wissen wichtig. Schon allein, um sich selbst als Blocker aufzulösen oder den sogenannten Boost-Faktor nach oben zu treiben. In dieser Episode machen wir mal eine kleine Tour durch die verschiedenen Knowledge-Sharing-Formate. Hackathons, Coding-Challenges, interne Konferenzen und Guilds, Bookclubs und Co. Was bringt wirklich was? Wie viel Aufwand ist es, sowas am Leben zu halten? Wer sollte das organisieren? Und wie sieht's aus mit der Balance zwischen Contributor und Information-Lurker? Und was passiert eigentlich, wenn solche Events zu inflationär genutzt werden? Wir teilen unsere Erfahrungen und worauf es besonders ankommt, wenn du etwas ähnliches in deiner Firma starten möchtest. Los geht's!",
//   "start": 4257,
//   "end": 59530,
//   "confidence": 0.8505821917808217,
//   "channel": null,
//   "speaker": "A"
// },

const content = JSON.parse(fs.readFileSync(filepath, 'utf8'))
const utterances = content.utterances

const getUtterancesIndex = (utterances, tokenCounterMax) => {
  let tokenCounter = 0
  let utterancesIndex = 0
  while (tokenCounter < tokenCounterMax && utterancesIndex < utterances.length) {
    tokenCounter += guessNUmberOfTokens(utterances[utterancesIndex].text)
    if (tokenCounter > tokenCounterMax) {
      break
    } else {
      utterancesIndex++
    }
  }
  return utterancesIndex
}

const convertUtterancesToMessages = (utterances) => {
  return utterances.map(u => {
    return { name: `Speaker${u.speaker}`, role: "user", content: u.text }
  })
}

const fetchChoices = async (messages) => {
  const completion = await openai.chat.completions.create({
    messages,
    model: "gpt-3.5-turbo",
    max_tokens: 500,
  });

  return completion
}

//split utterances in chunks of 2000 tokens
const utterancesChunks = []
let currentChunk = utterances
while (currentChunk.length > 0) {
  const utterancesIndex = getUtterancesIndex(currentChunk, 2000)
  utterancesChunks.push(currentChunk.slice(0, utterancesIndex))
  currentChunk = currentChunk.slice(utterancesIndex)
}

async function main() {

  const choices = []

  for (const chunk of utterancesChunks) {

    const messages = [
      {
        role: "system", content: `You will be provided a part of a transcript of a podcast episode. Your task is to write a short summary of this part of the episode.

- The input test is in German, the summary should be in German as well.
- The summary should contain as many details as possible.
  `},
      ...convertUtterancesToMessages(chunk)
    ]
    choices.push(await fetchChoices(messages))
  }

  console.log(JSON.stringify(choices))

}


main();