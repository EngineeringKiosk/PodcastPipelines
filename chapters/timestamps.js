const fs = require('fs')
const path = require('path')

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
    // copy the topic before the ad to the end to specify the ongoing topic again
    timestamps.splice(adStartIndex + 1, 0, [adEndTime, timestamps[adStartIndex - 1][1]])

    // due to the splitting of the topic, one part might be too short
    // make sure that the chapter before and after the ad have at least 5 seconds, otherwise delete it
    const minChapterDuration = 5
    if (timestamps[adStartIndex - 1][0] + minChapterDuration > adStartTime) {
      timestamps.splice(adStartIndex - 1, 1)
    }
    if (timestamps[adStartIndex + 1][0] - minChapterDuration < adEndTime) {
      timestamps.splice(adStartIndex + 2, 1)
    }

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

function findTranscriptFile(path) {
  //find transcript file *transcript-slim.json
  const files = fs.readdirSync(path, { withFileTypes: true })
    .filter(f => !f.isDirectory() && f.name.includes("transcript-slim.json"))

  if (files.length) {
    return files[0].name
  }
  return null
}

function adaptTranscript(path, adStartTime = 0, adEndTime = 0, introDuration = 0) {
  if ((adStartTime < 1 || adEndTime < 1) && introDuration < 1) {
    return
  }
  //find transcript file *transcript-slim.json
  const transcriptFile = findTranscriptFile(path)

  if (transcriptFile) {
    console.log("Found transcript file: " + transcriptFile)
    const transcript = JSON.parse(fs.readFileSync(transcriptFile))
    const introDurationMs = introDuration * 1000
    const start = adStartTime * 1000
    const duration = adEndTime * 1000 - start

    // move all utterances after the ad to the end of the ad
    for (let i = 0; i < transcript.utterances.length; i++) {
      const u = transcript.utterances[i]
      u.start = u.start + introDurationMs
      u.end = u.end + introDurationMs
      if (start > 0 && duration > 0 && u.start >= start) {
        u.start = u.start + duration
        u.end = u.end + duration
      }
    }

    // overwrite with the updated transcript
    fs.writeFileSync(transcriptFile, JSON.stringify(transcript, null, 2))
    console.log("Transcript adapted")
  }
}

module.exports = { parseTimeStamps, injectIntro, injectAd, prettyPrintSeconds, writeFile, guessChapterFileName, adaptTranscript, findTranscriptFile }