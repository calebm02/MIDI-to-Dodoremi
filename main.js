
//figure out difficulty with some sort of weighing system
//get the lane count automatically
//add in the guides
//get data from multiple tracks

let midiParser  = require('midi-parser-js-4.0.4');
let fs = require('fs');
//the entire length of the song
let songLength = 0;
//the note number in MIDI CC
var inputs = [];
var guidesArray = [];
// BPM -> MS conversion
const bpm = 120
const framesPerBeat = 96;
//converts BPM to beats per second
const beatsPerSecond = bpm / 60;
//converts beats per second to frames per millisecond
const msPerFrames = 1000 / (framesPerBeat * beatsPerSecond);
//ms per bar
const barLength = msPerFrames * framesPerBeat * 4
//length of the song in bars

var masterJson = {
    "slug": "tutorial",
    "composer": "COMPOSER",
    "duration": songLength,
    "bucket": "Original",
    "scaleKey": "a",
    "scaleType": "minor",
    "guideStartOffset": 0,
    "guide": [],
    "hasLocalizedBackingTrack": true,
    "beatmaps": [[]],
};
var beatmaps = {
    "slug": "signature",
    "type": "Discrete",
    "category": "Signature",
    "difficulty": 3,
    "instruments": [
      "guitar-metal-notes"
    ],
    "instrumentRequirements": [
        "Melodic",
        "Sustain"
    ],
    "events": [],
    "inputs": [],
    "laneCount": 1
}

var otherJsonstuff ={"preferredAssignments": [
    [
      "melody",
      "guitar-metal-notes"
    ],
    [
      "counter-melody",
      "guitar-metal-notes"
    ],
    [
      "drums",
      "drum-set-clean"
    ],
    [
      "bass",
      "electric-bass"
    ],
    [
      "harmony",
      "guitar-metal-notes"
    ],
    [
      "signature",
      "drum-set-clean"
    ],
    [
      "aux-percussion",
      "cow-bell"
    ],
    [
      "melody",
      "constant-scream"
    ],
    [
      "signature",
      "cheeks-melody"
    ],
    [
      "drums",
      "beatbox"
    ],
    [
      "bass",
      "contrabassoon"
    ],
    [
      "aux-percussion",
      "alarm-clock"
    ],
    [
      "counter-melody",
      "taz-the-cat"
    ]
  ]
}

function addNotes (start, duration, noteCCNumber){
    var notePosition = [
        {start: Math.round(start), lanes:[0], notes: [{"start": 0,"duration": Math.round(duration),"note": Math.round(noteCCNumber)}]},
    ];
    inputs = inputs.concat(notePosition);
}
//reads the midi file and parses it at base64
fs.readFile('./midi.mid', 'base64', function (err,data){
    var midiArray = midiParser.parse(data);
    getInformation(midiArray);
}
)

//gets actual chart information from midi
function getInformation(midiArray){
    var noteCCNumber = [];
    var noteLength = [];
    var startPoint = [];
    console.log(midiArray.track[0].event[6]);
    //for each event on the first track, find a noteOn message (type 9)
    midiArray.track[0].event.forEach(function(element){
        if(element.deltaTime != 0){
            songLength += (element.deltaTime * msPerFrames);
        }

        

        let i = 0;
        noteCCNumber.forEach(function(index){
                noteLength[i] += (element.deltaTime * msPerFrames);
                i++
        })

        //if the event is a noteOn add the length, start, and note number to the array
        if(element.type == 9){
            //this outputs the midi CC note
            noteCCNumber.push(element.data[0]);
            noteLength.push(0);
            startPoint.push(songLength);
        }else if (element.type == 8) {
            let i = 0;
            noteCCNumber.forEach(function(index){
                if (index == element.data[0]){
                    addNotes(startPoint[i], noteLength[i], noteCCNumber[i]);
                    //resets the note length when the next note starts
                    noteLength.splice(i, 1);
                    noteCCNumber.splice(i, 1);
                    startPoint.splice(i, 1);
                }
                i++;
            })
        }
    });
    writeJsonFile(inputs);
}

function createGuides(){
    const songBarLength = (songLength / barLength);
    let b = 0;
    let every4bars = 0;
        for (let i = 0; i < songBarLength; i++){
            guidesArray[b] = barLength * i;
            b++
            if (b > 3 || i == songBarLength - 1){
                guidesArray.sort(function(a, b){
                    return a - b;
                });
                masterJson.guide[every4bars] = guidesArray;
                every4bars++
                b = 0;
                guidesArray = [];
            }
        }

}

function writeJsonFile(inputString){
    createGuides();
    beatmaps.inputs = inputString
    masterJson.beatmaps[0] = beatmaps;
    masterJson.duration = Math.round(songLength);
    masterJson.preferredAssignments = otherJsonstuff;
    const data = JSON.stringify(masterJson, null, 2);
    fs.writeFile("config.json", data, (error) => {
        if (error) {
            console.error(error);
            throw error;
        }
    });
}



