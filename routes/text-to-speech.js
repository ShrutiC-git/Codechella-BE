var router = require('express').Router();
const path = require('path');
// Imports the Google Cloud client library
const textToSpeech = require('@google-cloud/text-to-speech');

const fs = require('fs');
const util = require('util');
// Creates a client
const client = new textToSpeech.TextToSpeechClient();
async function quickStart(text) {
  const request = {
    input: {text: text},
    // Select the language and SSML voice gender (optional)
    voice: {languageCode: 'en-US', ssmlGender: 'NEUTRAL'},
    // select the type of audio encoding
    audioConfig: {audioEncoding: 'MP3'},
  };

  // Performs the text-to-speech request
  const [response] = await client.synthesizeSpeech(request);
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  await writeFile('output.mp3', response.audioContent, 'binary');
  console.log('Audio content written to file: output.mp3');
  // return response;
}
// quickStart("I am Balla Guna Sai Sandeep");

router.get('/', async function (req, res) {
  await quickStart(req.query["text"]);
  var options = {
    root: path.join(__dirname)+'/../',
    acceptRanges: false
  };
  res.sendFile('output.mp3',options, function(err){
    if (err) console.log(err);
  });
  console.log("ok");
})


module.exports = router;
