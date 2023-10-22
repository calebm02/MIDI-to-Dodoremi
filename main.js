let midiParser  = require('midi-parser-js-4.0.4');
let fs = require('fs');
//the length of the current note (this is currently broken)
let noteLength = 0;
//the entire length of the song
let songLength = 0;
var noteCCNumber;

// BPM -> MS conversion
const bpm = 120
const framesPerBeat = 96;
//converts BPM to beats per second
const beatsPerSecond = bpm / 60;
//converts beats per second to frames per millisecond
const msPerFrames = 1000 / (framesPerBeat * beatsPerSecond);
//ms per bar
const barLength = msPerFrames * framesPerBeat * 4


//reads the midi file and parses it at base64
fs.readFile('./midi.mid', 'base64', function (err,data){
    var midiArray = midiParser.parse(data);
    console.log(midiArray.track[0].event[1])
    //for each event on the first track, find a noteOn message (type 9) and print "noteOn"
    midiArray.track[0].event.forEach(function(element){
        songLength += (element.deltaTime * msPerFrames);
        //if the event is a noteOn get the CC data
        if(element.type == 9){
            //this outputs the midi CC note
            noteCCNumber = element.data[0];
            //resets the note length when the next note starts
            noteLength = 0;
        }else if (element.type == 8) {
            noteLength += (element.deltaTime * msPerFrames);
            //console.log(noteLength);
        }
    });
    //length of song in bars (not fully tested yet)
    var songBarLength = (songLength / barLength);
    //console.log(songBarLength);
}
)


