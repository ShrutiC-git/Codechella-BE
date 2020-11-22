var express = require('express');
const bodyParser = require('body-parser');
const { request } = require('http');
const multer = require('multer');
var upload = multer({ dest: __dirname + '/public/uploads/' });
var type = upload.single('audio_file.mp3');
const fs = require('fs');


var tweet_route = express.Router();
tweet_route.use(bodyParser.json())
tweet_route.use(bodyParser.urlencoded({ extended: true }));


tweet_route.route('/speechtotext')
    .post(type, async(req, res, next) => {
        console.log('okay')
        console.log('The file is ', req.file);

        const { IamAuthenticator } = require('ibm-watson/auth');
        const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');

        const speechToText = new SpeechToTextV1({
            authenticator: new IamAuthenticator({ apikey: 'i0xHingmfg8GUXQpu5uGl1zeWglHzmonnOsro4DqN5r6' }),
            serviceUrl: 'https://api.us-south.speech-to-text.watson.cloud.ibm.com/instances/998ca5f9-e981-4dc5-8faa-6841e8a63dae'
        });
        const params = {
           audio: req.file,
           contentType: 'audio/mp3'
         };
       let words = [];
       let stream = fs.createReadStream(req.file.path)
            .pipe(speechToText.recognizeUsingWebSocket({ contentType: 'audio/mp3' }));
       stream.on('data',(chunk)=>{words.push(chunk.toString()); console.log(words)});
       stream.on('end',()=>{
         let tweet = "";
         for (word of words) {
           tweet += word;
         }
         console.log(tweet);
         let new_tweet = tweet.replace(/hash tag /gi, "#");
         tweet = new_tweet;
         new_tweet = tweet.replace(/hashtag /gi, "#");
         console.log(new_tweet);
         res.send(new_tweet);
       });
    })
module.exports = tweet_route
