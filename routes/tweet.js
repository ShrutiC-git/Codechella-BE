var express = require('express');
const bodyParser = require('body-parser');

var tweet_route = express.Router();
tweet_route.use(bodyParser.json())

tweet_route.route("/")

    .post((req, res, next) => {
        console.log(req);
        const fs = require('fs');
        const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
        const { IamAuthenticator } = require('ibm-watson/auth');

        const textToSpeech = new TextToSpeechV1({
            authenticator: new IamAuthenticator({ apikey: 'KUyOqkpvbsprMFP4Fwn4sfqu8Zoo_3j6jIAB6jHWLEJF' }),
            serviceUrl: 'https://api.us-south.text-to-speech.watson.cloud.ibm.com/instances/7b9e27f6-ea06-41b0-ae91-2111b0eb402d'
        });

        const paramst2s = {
            text: req.body.text,
            voice: 'en-US_AllisonVoice', // Optional voicec
            accept: 'audio/wav'
        };

        // Synthesize speech, correct the wav header, then save to disk
        // (wav header requires a file length, but this is unknown until after the header is already generated and sent)
        // note that `repairWavHeaderStream` will read the whole stream into memory in order to process it.
        // the method returns a Promise that resolves with the repaired buffer
        textToSpeech
            .synthesize(paramst2s)
            .then(response => {
                const audio = response.result;
                return textToSpeech.repairWavHeaderStream(audio);
            })
            .then(repairedFile => {
                fs.writeFileSync('audio.wav', repairedFile);
                console.log('audio.wav written with a corrected wav header');
            })
            .catch(err => {
                console.log(err);
            });

        res.statusCode = 200;
        res.contentType = 'text/plain'
        res.send('This is working');
        console.log('Lets see if we got results')
    })

tweet_route.route('/speechtotext')
    .post((req, res, next) => {
        const fs = require('fs');
        const { IamAuthenticator } = require('ibm-watson/auth');
        const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');

        const speechToText = new SpeechToTextV1({
            authenticator: new IamAuthenticator({ apikey: 'i0xHingmfg8GUXQpu5uGl1zeWglHzmonnOsro4DqN5r6' }),
            serviceUrl: 'https://api.us-south.speech-to-text.watson.cloud.ibm.com/instances/998ca5f9-e981-4dc5-8faa-6841e8a63dae'
        });

        const params = {
            // From file
            audio: req.body.recording,
            contentType: 'audio/mp3'
        };

        speechToText.recognize(params)
            .then(response => {
                console.log(JSON.stringify(response.result, null, 2));

            })

            .catch(err => {
                console.log(err);
            });

        // or streaming
        /* fs.createReadStream(req.body.recording)
            .pipe(speechToText.recognizeUsingWebSocket({ contentType: 'audio/wav' }))
            .pipe(fs.createWriteStream('./transcription.txt'));
 */
        res.statusCode = 200;
        res.contentType = 'text/plain'
        res.send('This is working');
        console.log('the request made was ', req.body)
        console.log(' we got results?: ')
    })

module.exports = tweet_route