let midiParser  = require('midi-parser-js-4.0.4');
let fs = require('fs');
//the length of the current note (this is currently broken)
let noteLength = 0;
//the entire length of the song
let songLength = 0;
//the note number in MIDI CC
var masterJson = [];
var inputs = [];
// BPM -> MS conversion
const bpm = 120
const framesPerBeat = 96;
//converts BPM to beats per second
const beatsPerSecond = bpm / 60;
//converts beats per second to frames per millisecond
const msPerFrames = 1000 / (framesPerBeat * beatsPerSecond);
//ms per bar
const barLength = msPerFrames * framesPerBeat * 4

function addNotes (start, duration, noteCCNumber){
    var notes
    var notePosition = [
        {start: 0, lanes:[5], notes: [start, duration, noteCCNumber]},
    ];
    inputs = inputs.concat(notePosition);
}
//reads the midi file and parses it at base64
fs.readFile('./midi.mid', 'base64', function (err,data){
    var midiArray = midiParser.parse(data);
    var noteCCNumber;
    //console.log(midiArray)
    //for each event on the first track, find a noteOn message (type 9) and print "noteOn"
    midiArray.track[0].event.forEach(function(element){
        songLength += (element.deltaTime * msPerFrames);
        //if the event is a noteOn get the CC data and push the last note
        if(element.type == 9){
            addNotes(0, noteLength, noteCCNumber);
            //this outputs the midi CC note
            noteCCNumber = element.data[0];
            //resets the note length when the next note starts
            noteLength = 0;
        }else if (element.type == 8) {
            noteLength += (element.deltaTime * msPerFrames);
        }
    });
    //length of song in bars (not fully tested yet)
    var songBarLength = (songLength / barLength);
    writeJsonFile(inputs);
}
)

function writeJsonFile(inputs){
    masterJson.push(inputs);
    const data = JSON.stringify(masterJson, null, 2);
    fs.writeFile("config.json", data, (error) => {
        if (error) {
            console.error(error);
            throw error;
        }
    });
}


