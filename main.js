/*TODO:
- figure out difficulty with some sort of weighing system
- add held notes
- devise a system to make pitches move up/down lanes? (maybe done)
- auto lanes may need to be tweaked as they are currently directly based on the amount of notes in a song.
*/

var midiParser = require('midi-parser-js-4.0.4');
var fs = require('fs');
var songLength = 0; //song length in ms
var allCharts = []; //array of curChart
var curChart = []; //temp variable that contains lines of jackbox's "input" string, for the current track being processed

var notesInSong = new Set(); //the set of all notes in the song
var noteMap = new Map(); //the map of notes to lanes

var difficulties = []; //difficulty for each track
var startPointsAll = []; //all start points for the current track
var maxNPS = [0,0,0]; //max notes per second over 1s, 5s, and 30s periods

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
fs.readFile('midis/billiejean.mid', 'base64', function (err,data){
    var midiArray = midiParser.parse(data);
    midiArray.track.forEach(function(element, index){
        getInformation(element, index);
    });
    writeJsonFile();
});

//gets actual chart information from midi
function getInformation(track, trackNum){
    songLength = 0;
    //temp arrays that hold notes that are noteOn but not noteOff yet
    var noteCCNumber = [];
    var noteLength = [];
    var startPoint = [];
    //for each event on the track, add deltaTime, and check for noteOn/noteOff
    track.event.forEach(function(element){
        songLength += (element.deltaTime * msPerFrames);   
        let i = 0;
        noteCCNumber.forEach(function(){
            noteLength[i] += (element.deltaTime * msPerFrames);
            i++;
        })

        //if the event is a noteOn add the length, start, and note number to the array
        if(element.type == 9){
            noteCCNumber.push(element.data[0]);
            noteLength.push(0); //if we add held notes, need to change this.
            startPoint.push(songLength);
			startPointsAll.push(songLength);
        //if the event is a noteOff
        }else if (element.type == 8) {
            let i = 0;
            noteCCNumber.forEach(function(index){
                if (index == element.data[0]){
                    addNotes(startPoint[i], noteLength[i], noteCCNumber[i], trackNum);
                    //add the midi note to a set
                    notesInSong.add(noteCCNumber[i]);
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
	difficulties.push(calculateDifficulty(startPointsAll));
	startPointsAll = [];
}

function addNotes (start, duration, noteCCNumber){
    var notePosition = [
        {start: Math.round(start), lanes:[1], notes: [{"start": 0,"duration": Math.round(duration),"note": Math.round(noteCCNumber)}]},
    ];
    curChart = curChart.concat(notePosition);
}

function createGuides(){ //note this function assumes 4/4 time
    const songBarLength = (songLength / barLength);
    const setsof4 = Math.floor((songBarLength+3)/4)*4;
    var guideArray = new Array(setsof4);
    for (let i = 0; i < setsof4; i++) {
        guideArray[i] = new Array(4);
    }
    for (let i = 0; i < setsof4*4; i++){
        guideArray[Math.floor(i/4)][i%4] = barLength * i / 4;
    }
    masterJson.guide = guideArray;
}
//adds lanes based on the amount of unique notes
function addLanes(voiceCount){
  if(beatmaps.laneCount < voiceCount){
    beatmaps.laneCount = voiceCount;
  }
  //overflow protection
  if (voiceCount > 6){
    voiceCount = 6;
  }
}

function mapNotesToLanes(){
  var notesInSongArray = Array.from(notesInSong);
  notesInSongArray.sort(function(a, b) {
    return a - b;
  });

  for (var b = 0; b < notesInSongArray.length; b++){
    for (var i = 0; i < Math.ceil(notesInSongArray.length / beatmaps.laneCount); i++){
      console.debug(Math.ceil(notesInSongArray.length / beatmaps.laneCount))
      noteMap.set(notesInSongArray[b], b);
    }
  }
}

function writeJsonFile(){
    addLanes(notesInSong.size);
    createGuides();
    mapNotesToLanes();
    //go through and assign the lanes to each note
    allCharts[0].forEach(function(element, index){
      element.lanes[0] = noteMap.get(element.notes[0].note);
    })
    //assign each track to the masterJson file
    allCharts.forEach(function(element, index){
        beatmaps.inputs = element;
		beatmaps.difficulty = difficulties[index];
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

//input a list of startPoints and a period, returns the max amount of startPoints that occured within that period anywhere in the list.
function maxNotesInTime(notes, period){
	var curMax = 0;
	var backIndex = 0;
	for(let i = 0; i < notes.length; i++){
		while((notes[i] - notes[backIndex]) > period){
			backIndex++;
		}
		curMax = Math.max(curMax, i-backIndex);
	}
	console.log("max notes in", period, "ms was", curMax);
	return curMax;
}

//formula is 10*maxNotes(1s)+4*maxNotes(5s)+maxNotes(30s), /40 and rounded down. these constants can be changed if we feel like it
function calculateDifficulty(notes){
	return Math.floor((10*maxNotesInTime(notes, 1000) + 3.5*maxNotesInTime(notes, 5000) + maxNotesInTime(notes, 30000))/40);
}