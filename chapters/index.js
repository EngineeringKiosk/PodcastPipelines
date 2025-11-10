const readline = require('readline')
const fs = require('fs')
const path = require('path')

const { parseTimeStamps, injectIntro, injectAd, prettyPrintSeconds, guessChapterFileName, writeFile, adaptTranscript, findTranscriptFile } = require('./timestamps');
const { exec } = require('child_process');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const newIntroText = "Intro"

function askQuestion(query) {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer);
    });
  });
}

async function main() {
  const introDuration = 0 //await askQuestion('How long is the intro (seconds)? ');

  console.log("Intro duration: " + introDuration + " seconds");

  const hasAd = "y" // await askQuestion('Is there an ad? (y/n): ');

  let adStartTime = 0;
  let adEndTime = 0;
  let adText = "Werbung"

  if (hasAd.toLowerCase() === 'y') {
    const minute = parseInt(await askQuestion('When does the ad start (minute))? '))
    const second = parseInt(await askQuestion('When does the ad start (second)? '));

    adStartTime = minute * 60 + second

    adEndTime = adStartTime + 60 // parseInt(await askQuestion('How long is the ad (seconds)? '))
    if (adStartTime >= adEndTime) {
      console.log("Ad start time must be before ad end time")
      process.exit(1)
    }
    console.log(`Ad starts at ${adStartTime} seconds and ends at ${adEndTime} seconds`);
    // ask for the ad text
    adText = "Info/Werbung" // await askQuestion('What is the ad text? ');
  }

  // check if *trasnscript* file exists otherwise exit
  if (findTranscriptFile(".") == null) {
    console.log("No transcript file found in current directory. Please make sure a transcript-slim.json file is present.")
    process.exit(1)
  }

  console.log("Paste skip navigation/timestamps and send an end file (CTRL-D):");

  const lines = [];
  rl.on('line', line => {
    lines.push(line);
  }).on("close", () => {

    let timestamps = parseTimeStamps(lines.join("\n"))
    timestamps = injectIntro(introDuration, newIntroText, timestamps)
    timestamps = injectAd(adStartTime, adEndTime, adText, timestamps)

    const filename = guessChapterFileName(".") || "filename.chapters.txt"
    writeFile(filename, timestamps.map(x => `${prettyPrintSeconds(x[0], false)}${x[1]}`).join('\n'))

    console.log("\n\n---- For Shownotes (updated) ----")
    console.log(timestamps.map(x => `${prettyPrintSeconds(x[0], true)}${x[1]}`).join('\n'))
    console.log("\n\n---- New timestamps written to " + filename)

    adaptTranscript(".", adStartTime, adEndTime, introDuration)

    rl.close();
  });
}

main();