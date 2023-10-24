/*TODO:
- figure out difficulty with some sort of weighing system
- get the lane count automatically
- add held notes
- devise a system to make pitches move up/down lanes?
*/

let midiParser = require('midi-parser-js-4.0.4');
let fs = require('fs');
let songLength = 0; //song length in ms
var allCharts = []; //array of curChart
var curChart = []; //temp variable that contains lines of jackbox's "input" string, for the current track being processed
// BPM -> ms conversion
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
    "composer": "Cameron C. Major",
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
      "tutorial"
    ],
    "instrumentRequirements": [
        "Melodic",
        "Sustain"
    ],
    "events": [],
    "inputs": [],
    "laneCount": 5
}

var otherJsonstuff =
    [
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

//reads the midi file and parses it at base64
fs.readFile('midis/cmajorscale.mid', 'base64', function (err,data){
    var midiArray = midiParser.parse(data);

    //print out translated midi (debug purposes)
    console.log(midiArray);
    midiArray.track[0].event.forEach(function(element){
      console.log(element);
    });

    midiArray.track.forEach(function(element, index){
        getInformation(element, index);
    });
    writeJsonFile();
});

//gets actual chart information from midi
function getInformation(track, trackNum){
    songLength = 0;
    var noteCCNumber = [];
    var noteLength = [];
    var startPoint = [];
    //for each event on the track, add deltaTime and if noteOn/noteOff, add necessary information to the curChart array
    track.event.forEach(function(element){
        songLength += (element.deltaTime * msPerFrames);   
        let i = 0;
        noteCCNumber.forEach(function(){
            noteLength[i] += (element.deltaTime * msPerFrames);
            i++;
        })

        //if the event is a noteOn add the length, start, and note number to the array
        if(element.type == 9){
            //this outputs the midi CC note
            noteCCNumber.push(element.data[0]);
            noteLength.push(0);
            startPoint.push(songLength);
        //if the event is a noteOff
        }else if (element.type == 8) {
            let i = 0;
            noteCCNumber.forEach(function(index){
                if (index == element.data[0]){
                    addNotes(startPoint[i], noteLength[i], noteCCNumber[i], trackNum);
                    //resets the note length when the next note starts
                    noteLength.splice(i, 1);
                    noteCCNumber.splice(i, 1);
                    startPoint.splice(i, 1);
                }
                i++;
            })
        }
    });
    allCharts.push(curChart);
    curChart = [];
}

function addNotes (start, duration, noteCCNumber){
    var notePosition = [
        {start: Math.round(start), lanes:[1], notes: [{"start": 0,"duration": Math.round(duration),"note": Math.round(noteCCNumber)}]},
    ];
    curChart = curChart.concat(notePosition);
}

function createGuides(){ //note this function assumes 4/4 time
    const songBarLength = (songLength / barLength);
    const setsof4 = Math.floor((songBarLength+3)/4);
    var guideArray = new Array(setsof4);
    for (let i = 0; i < setsof4; i++) {
        guideArray[i] = new Array(4);
    }
    for (let i = 0; i < setsof4*4; i++){
        guideArray[Math.floor(i/4)][i%4] = barLength * i / 4;
    }
    masterJson.guide = guideArray;
}

function writeJsonFile(){
    createGuides();
    allCharts.forEach(function(element, index){
        beatmaps.inputs = element;
        masterJson.beatmaps[index] = beatmaps;
    });
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
