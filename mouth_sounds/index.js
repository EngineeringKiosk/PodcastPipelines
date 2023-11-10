const fs = require('fs');
const { exec } = require('child_process');

const jsonFilePath = '/home/woolf/projects/engineeringkiosk/PodcastPipelines/mouth_sounds/cleanvoicetest.mp3.json';
const audioFilePath = '/home/woolf/projects/engineeringkiosk/PodcastPipelines/mouth_sounds/cleanvoicetest.mp3';
const mouthSound = ["äh", "ähm"]

function readJsonFile(filePath) {
  try {
    const jsonData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(jsonData);
  } catch (err) {
    console.error('Error reading JSON file:', err);
    return null;
  }
}

function getMouthSoundPositions(jsonData, mouthSound) {
  const mouthSoundPositions = [];

  jsonData.segments.forEach(segment => {
    const words = segment[3];
    words.forEach(wordData => {
      const [start, end, word, confidence] = wordData;
      // remove whitespaces and punctuation before comparing
      const cleanWord = word.replace(/[\s.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      if (mouthSound.includes(cleanWord)) {
        console.log(`Found mouth sound "${cleanWord}" at ${start} - ${end}`);
        mouthSoundPositions.push([start, end]);
      }
    })
  });

  return mouthSoundPositions;
}


function executeFFmpegSilenceCommand(audioFile, silencePositions) {
  // ffmpeg -i video.mp4 -af "volume=enable='between(t,5,10)':volume=0, volume=enable='between(t,15,20)':volume=0" ...
  const silenceArgs = silencePositions.map(pos => `volume=enable='between(t,${pos[0]},${pos[1]}):volume=0'`).join(', ');
  const outputFilePath = './output_silenced_audio.mp3';

  const ffmpegCommand = `ffmpeg -i ${audioFile} -af "${silenceArgs}" ${outputFilePath}`;

  console.log('Executing ffmpeg command:', ffmpegCommand);

  exec(ffmpegCommand, (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing ffmpeg:', error);
    } else {
      console.log('Silenced audio successfully.');
    }
  });
}

function main() {
  const jsonData = readJsonFile(jsonFilePath);

  if (!jsonData) {
    console.error('Error reading JSON data.');
    return;
  }

  const silencePositions = getMouthSoundPositions(jsonData, mouthSound);

  if (silencePositions.length === 0) {
    console.log('No mouth sounds found in the JSON data.');
    return;
  }

  executeFFmpegSilenceCommand(audioFilePath, silencePositions);
}

main();
