var express = require('express');
const bodyParser = require('body-parser');
const { request } = require('http');
const multer = require('multer');
var upload = multer({ dest: __dirname + '/public/uploads/' });
var type = upload.single('audio_file.mp3');
const fs = require('fs');
const { promisify } = require('util')
const fspromises = require('fs').promises;
var ProWritingAidApi = require('pro_writing_aid_api');
const requestapi = require('request');
const { checkServerIdentity } = require('tls');



var defaultClient = ProWritingAidApi.ApiClient.instance;
var tweet_route = express.Router();
tweet_route.use(bodyParser.json())
tweet_route.use(bodyParser.urlencoded({ extended: true }));



tweet_route.route("/")

    .post((req, res, next) => {
        console.log(req);
        const fs = require('fs');
        const TextToSpeechV1 = require('ibm-watson/text-to-speech/v1');
        const { IamAuthenticator } = require('ibm-watson/auth');

        const textToSpeech = new TextToSpeechV1({
            authenticator: new IamAuthenticator({ apikey: '' }),
            serviceUrl: ''
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

    .post(type, (req, res, next) => {
        console.log('okay')
        //console.log('The file is ', req.file);

        const { IamAuthenticator } = require('ibm-watson/auth');
        const SpeechToTextV1 = require('ibm-watson/speech-to-text/v1');

        const speechToText = new SpeechToTextV1({
            authenticator: new IamAuthenticator({ apikey: 'i0xHingmfg8GUXQpu5uGl1zeWglHzmonnOsro4DqN5r6' }),
            serviceUrl: 'https://api.us-south.speech-to-text.watson.cloud.ibm.com/instances/998ca5f9-e981-4dc5-8faa-6841e8a63dae'
        });

        let writer = fs.createWriteStream('./transcription.txt');
        fs.createReadStream(req.file.path)
            .pipe(speechToText.recognizeUsingWebSocket({ contentType: 'audio/mp3' }))
            .pipe(writer)

        writer.on('close', function cb() {
            fs.readFile('./transcription.txt', 'utf-8', (err, data) => {
                if (err) throw err;
                else {
                    const dataSend = data;
                    console.log(dataSend);
                    res.statusCode = 200;
                    res.json({
                        data: dataSend
                    })
                    funcAfter(dataSend)
                }
            })
        })
        function funcAfter(dataSend) {
            /* console.log('after the first call')
            var api = new ProWritingAidApi.TextApi();
            api.apiClient.basePath = "https://api.prowritingaid.com";
            api.apiClient.defaultHeaders = { 'licenseCode': '4C913CB4-0CF6-440C-B663-AA07FAC07F71' }
            var request = new ProWritingAidApi.TextAnalysisRequest(
                'I did not jumped',
                ['grammar'],
            );
            api.post(request)
                .then(function (data) {
                    console.log('API called successfully. Returned data: ');
                    console.log(data);

                }, function (error) {
                    console.error(error);
                }) */
            console.log('The dataSend we are receiving is ', dataSend);
            const options = {
                method: 'POST',
                url: 'https://textanalysis.p.rapidapi.com/spacy-noun-chunks-extraction',
                headers: {
                    'content-type': 'application/x-www-form-urlencoded',
                    'x-rapidapi-key': '9358ebcda8msh8eea6d58e87dae9p1b9bb6jsn49421b7642a0',
                    'x-rapidapi-host': 'textanalysis.p.rapidapi.com',
                    useQueryString: true
                },
                form: { text: dataSend }
            };

            requestapi(options, function (error, response, body) {
                if (error) throw new Error(error);

                console.log('Results are', body);
                const bodyR = JSON.parse(body);
                console.log(bodyR.result)
                grammarCheck(bodyR.result);

            });

            async function grammarCheck(bodyR) {
                console.log('testing')
                for (var i = 0; i < bodyR.length; i++) {
                    var word = bodyR[i];
                    if (word.length === 1) {
                        continue;
                    }
                    console.log('The word to go into the func is', word)
                    let res = await promiseReturn(word);
                    console.log(`Words similar to ${word} are ${res}`);

                }
            }

            function promiseReturn(word) {
                const options = {
                    method: 'GET',
                    url: `https://api.datamuse.com/words?ml=${word}&max=5`,
                };
                return new Promise(function (resolve, reject) {
                    requestapi(options, function (error, response, body) {

                        /* if (error) throw new Error(error); */
                        if (error) reject(error);

                        console.log('Results are ', body)
                        const useArray = eval(body)
                        console.log(`Evaled body is ${word}`, useArray)

                        var array = new Array();
                        for (var j = 0; j <= 2; j++) {
                            var object = useArray[j];
                            //return object.word 
                            array.push(object.word)
                        }
                        resolve(array)
                        //console.log(`Words similar to ${word} are ${array}`)
                    })
                })
            }
            /* function suggest(word) {
                const options = {
                    method: 'GET',
                    url: `https://api.datamuse.com/words?ml=${word}&max=3`,
                };
                requestapi(options, function (error, response, body) {
                    if (error) throw new Error(error);

                    console.log('Results are', body);

                    for (var i = 0; i <= 2; i++) {
                        console.log(body[i])
                         var objectParse = JSON.parse(body[i]); 
                          console.log('The word is ', objectParse.word) 
                    }
                });
            } */
        }

        /* const data = promisify(fs.readFile('./transcription.txt')); */
        /*       const data = async () => {
                  fs.readFile('./transcription.txt')
              }
              if (data.toString.length) {
                  console.log(data);
              }
              else {
                  const result = async () => {
                      const print = await data
                      return print;
                  }
                  console.log(result)
              } */


        /* async function readtest() {
            try {
                const data = await fs.readFile('transcription.txt')
            }
            /* catch ((error) => {
                console.log("Error: " + err.message)
            })    
        } */

        /* const data = readtest();
        console.log(data); */
    })

tweet_route.route('/tweetanalysis')
    .post((req, res, next) => {

        const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');
        const { IamAuthenticator } = require('ibm-watson/auth');

        const nlu = new NaturalLanguageUnderstandingV1({
            authenticator: new IamAuthenticator({ apikey: '75yxn4jmMfH9Qw2b7T1aZr-coNrNr-5ue6c6u8gFfy3T' }),
            version: '2018-04-05',
            serviceUrl: 'https://api.us-south.natural-language-understanding.watson.cloud.ibm.com/instances/3e457b95-b896-436d-8bc2-33fff7407782'
        });

        nlu.analyze(
            {
                text: 'I went to the beach today, and had a great time', // Buffer or String we will receive from the user in the back end once they compelte writing the tweet
                features: {
                    concepts: { limit: 3 },
                    keywords: {
                        sentiment: true,
                        emotion: true
                    },
                    entities: {
                        sentiment: true,
                        limit: 2
                    }
                }
            })
            .then(response => {
                console.log(JSON.stringify(response.result, null, 2));
            })
            .catch(err => {
                console.log('error: ', err);
            });
    })


/*       const check = promisify(fs.readFile('./transcription.txt', 'utf-8'))
      function getStuff() {
          return check();
      }
      getStuff().then(data => console.log(data));
 
      res.statusCode = 200;
      res.send = 'Response is sent';
      console.log(res); */

/*         const writeFile = () => {
            new Promise((resolve, reject) => {
                fs.createReadStream(req.file.path)
                    .pipe(speechToText.recognizeUsingWebSocket({ contentType: 'audio/mp3' }))
                    .pipe(fs.createWriteStream('./transcription.txt'), (err, data) => {
                        if (err) reject(err)
                        else {
                            resolve(data)
                            console.log(data)
                        }
                    })
            })
        } */
/*         const readFile = (path, opts = 'utf-8') => {
            new Promise((resolve, reject) => {
                fs.readFile(path, opts, (err, data) => {
                    if (err) reject(err)
                    else resolve(data)
                })
            })
        } */
/*       const run = async () => {
          const res = await writeFile('./transcription.txt')
           console.log(res) 
      }
      run(); */

/*         const params = {
            // From file
            audio: req.file.path,
            contentType: 'audio/mp3'
        };
        speechToText.recognize(params)
            .then(response => {
                console.log(JSON.stringify(response.result, null, 2));
            })
 
            .catch(err => {
                console.log(err);
            }); */


/* fs.createReadStream('../twitter-test-server/audio.wav') */

/*   fs.createReadStream(req.file.path)
      .pipe(speechToText.recognizeUsingWebSocket({ contentType: 'audio/mp3' }))
      .pipe(fs.createWriteStream('./transcription.txt'))
   */
/* const writeFileAsync = promisify(fs.createReadStream(req.file.path)
    .pipe(speechToText.recognizeUsingWebSocket({ contentType: 'audio/mp3' }))
    .pipe(fs.createWriteStream('./transcription.txt'))) */

/*    const run = async () => {
       const res1 = await writeFileAsync();
       console.log(res1);
   }
   run() */

/*         async function readcontent() {
            const complete = await fs.createReadStream(req.file.path)
                .pipe(speechToText.recognizeUsingWebSocket({ contentType: 'audio/mp3' }))
                .pipe(fs.createWriteStream('./transcription.txt'))
 
            if (complete) {
                fs.readFile('transcription.txt', 'utf-8', function (err, buf) {
                    if (err) {
                        throw err;
                    }
                    console.log(buf);
                })
            }
        } */



/*         fs.readFile('transcription.txt', 'utf-8', function (err, buf) {
            if (err) {
                throw err;
            }
            const content = buf;
            processFile(content)
        })
 
        function processFile(content) {
            console.log('Content is', content);
        } */



/* tweet_route.route('/speechtotext')
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
            audio: req.data,
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
        console.log(req.body)
        var file = new File([req.body.recording],'audio.mp3')
        fs.createReadStream(file)
            .pipe(speechToText.recognizeUsingWebSocket({ contentType: 'audio/mp3' }))
            .pipe(fs.createWriteStream('./transcription.txt')); 

        res.statusCode = 200;
        res.contentType = 'text/plain'
        res.send('This is working');
        console.log('the request made was ', req.body)
        console.log(' we got results?: ')
    })
 */



/* 
Create a secondary hit from within the bacend to this api end
const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1');

const nlu = new NaturalLanguageUnderstandingV1({
    authenticator: new IamAuthenticator({ apikey: '' }),
    version: '2018-04-05',
    serviceUrl: ''
});

nlu.analyze(
    {
      text:paramst2s.text, // Buffer or String
      features: {
          entities:{
              sentiment:true
          },
        concepts: {},
        keywords: {
            sentiment:true,
            emotion:true
        }
      }
    })
    .then(response => {
      console.log(JSON.stringify(response.result, null, 2));
    })
    .catch(err => {
      console.log('error: ', err);
    }); */


module.exports = tweet_route