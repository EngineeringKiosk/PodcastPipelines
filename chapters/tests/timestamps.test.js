const readline = require('readline')
const fs = require('fs')
const path = require('path')

const { parseTimeStamps, injectIntro, injectAd, prettyPrintSeconds, guessChapterFileName, writeFile, adaptTranscript } = require('../timestamps')

const testfile = "test-transcript-slim.json"
const origTestfile = "133-transcript-slim.orig.json"


// copy the original file to a test file
fs.copyFileSync(origTestfile, testfile)

const origJson = JSON.parse(fs.readFileSync(origTestfile))

const introDuration = 47
const adStartTime = 454
const adEndTime = adStartTime + 67

adaptTranscript(".", adStartTime, adEndTime, introDuration)

const adaptedJson = JSON.parse(fs.readFileSync(testfile))

const introDurationMs = introDuration * 1000
const adStartTimeMs = adStartTime * 1000
const adEndTimeMs = adEndTime * 1000
const adDurationMs = adEndTimeMs - adStartTimeMs

// check for all utterances if they are adapted correctly
let success = true
origJson.utterances.forEach((u, i) => {
  const au = adaptedJson.utterances[i]
  if (u.start < adStartTimeMs - introDurationMs) {
    if (au.start !== u.start + introDurationMs) {
      console.log(`Start time before Ad not adapted for ${i}: ${au.start} !== ${u.start + introDurationMs}`)
      success = false
    }
    if (au.end !== u.end + introDuration * 1000) {
      console.log(`End time before Ad not adapted for ${i}: ${au.end} !== ${u.end + introDurationMs}`)
      success = false
    }
  } else {
    if (au.start !== u.start + introDurationMs + adDurationMs) {
      console.log(`Start time after Ads not adapted for ${i}: ${au.start} !== ${u.start + introDurationMs + adDurationMs}`)
      success = false
    }
    if (au.end !== u.end + introDurationMs + adDurationMs) {
      console.log(`End time after Ads not adapted for ${i}: ${au.end} !== ${u.end + introDurationMs + adDurationMs}`)
      success = false
    }
  }
})

if (success) {
  console.log("All times adapted correctly")
}