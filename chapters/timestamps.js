const readline = require('readline');
const fs = require('fs')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const secondsToAdd = 54
const newIntroText = "Intro"

function generateTimestamps(introDuration, introText, timestampText) {
  const timestampLines = timestampText.split(/\r?\n/)
  const timestamps = timestampLines.map(line => {
    //separate the time and text of the line
    const matches = line.match(/(\([0-9]{2}:[0-9]{2}:[0-9]{2}\))(.*)/)
    // get rid of the () around the time
    const timeString = matches[1].replace("(", "").replace(")", "")
    // add the secondsToAdd
    const newTime = new Date(Date.parse("2020-01-01 " + timeString) + 1000 * secondsToAdd)
    // generate the new calculated time string
    const newTimeString = newTime.toTimeString().substring(0, 8)
    return [newTimeString, matches[2]]
  })

  // add a new start which starts at 0 tp be consistent
  if (introDuration > 0) {
    timestamps.unshift(["00:00:00", " " + newIntroText])
  }

  return timestamps
}

function writeFile(filepath, content) {
  const file = fs.createWriteStream(filepath)
  file.write(content)
  file.close()
}

rl.question('How long is the intro?', function (introDuration) {
  console.log("Paste skip navigation/timestamps and send an end file (CTRL-D):")
  const lines = []
  rl.on('line', line => {
    lines.push(line)
  }).on("close", () => {
    const timestamps = generateTimestamps(parseInt(introDuration), newIntroText, lines.join("\n"))

    const filename = "./mp3_file.chapters.txt"
    writeFile(filename, timestamps.map(x => x[0] + x[1]).join('\n'))

    console.log("New timestamps written to " + filename)
    console.log("\n\n---- For Shownotes (updated) ----")
    console.log(timestamps.map(x => `(${x[0]})${x[1]}`).join('\n'))
  })
})