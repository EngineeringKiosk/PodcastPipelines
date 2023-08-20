const readline = require('readline')
const fs = require('fs')
const path = require('path')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const newIntroText = "Intro"

// returns an array of [time, text] pairs, where time is specified as the number of seconds
function parseTimeStamps(timestampText) {
  const timestampLines = timestampText.split(/\r?\n/)
  const timestamps = timestampLines.map(line => {
    //separate the time and text of the line
    const matches = line.match(/(\([0-9]{2}:[0-9]{2}:[0-9]{2}\))(.*)/)
    // get rid of the () around the time
    const timeString = matches[1].replace("(", "").replace(")", "")
    // parse the time string to get the total number of seconds
    const timeParts = timeString.split(":")
    const seconds = parseInt(timeParts[0]) * 3600 + parseInt(timeParts[1]) * 60 + parseInt(timeParts[2])
    return [seconds, matches[2]]
  })
  return timestamps
}

function injectIntro(introDuration, introText, timestamps) {
  if (introDuration > 0) {
    // add the intro duration to all timestamps
    timestamps = timestamps.map(x => [x[0] + parseInt(introDuration), x[1]])
    // add a new start which starts at 0 tp be consistent
    timestamps.unshift([0, " " + introText])
  }
  return timestamps
}


function injectAd(adStartTime, adEndTime, adText, timestamps) {
  if (adStartTime > 0 && adEndTime > 0 && adStartTime < adEndTime) {
    // find the position where to inject the ad
    const adStartIndex = timestamps.findIndex(x => x[0] > adStartTime)
    // add the ad duration to all timestamps after the ad
    timestamps = timestamps.map(x => [x[0] + (x[0] > adStartTime ? adEndTime - adStartTime : 0), x[1]])
    // insert the ad and push all other timestamps back
    timestamps.splice(adStartIndex, 0, [adStartTime, " " + adText])
  }
  return timestamps
}

function prettyPrintSeconds(seconds, sourroundWithBrackets = false) {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds - hours * 3600) / 60)
  const secs = seconds - hours * 3600 - minutes * 60
  // output with leading zeros
  const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  return sourroundWithBrackets ? `(${timeString})` : timeString
}


function writeFile(filepath, content) {
  const file = fs.createWriteStream(filepath)
  file.write(content)
  file.close()
}

function guessChapterFileName(dirpath) {
  const files = fs.readdirSync(dirpath, { withFileTypes: true })
    //filter for mp3 extension and files only
    .filter(f => !f.isDirectory() && path.extname(f.name) == ".mp3")
  if (files.length) {
    const newestFile = files.map(f => ({ name: f.name, ctime: fs.statSync(f.name).ctime }))
      .sort((a, b) => b.ctime - a.ctime)[0].name
    const basename = path.basename(newestFile, '.mp3')
    return basename + ".chapters.txt"
  }
  return null
}

function askQuestion(query) {
  return new Promise(resolve => {
    rl.question(query, answer => {
      resolve(answer);
    });
  });
}

async function main() {
  const introDuration = await askQuestion('How long is the intro (seconds)? ');

  console.log("Intro duration: " + introDuration + " seconds");

  const hasAd = await askQuestion('Is there an ad? (y/n): ');

  let adStartTime = 0;
  let adEndTime = 0;
  let adText = "Werbung"

  if (hasAd.toLowerCase() === 'y') {
    adStartTime = parseInt(await askQuestion('When does the ad start (position in seconds)? '))
    adEndTime = adStartTime + parseInt(await askQuestion('How long is the ad (seconds)? '))
    if (adStartTime >= adEndTime) {
      console.log("Ad start time must be before ad end time")
      process.exit(1)
    }
    console.log(`Ad starts at ${adStartTime} seconds and ends at ${adEndTime} seconds`);
    // ask for the ad text
    adText = await askQuestion('What is the ad text? ');
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
    rl.close();
  });
}

main();