let midiParser  = require('midi-parser-js-4.0.4');
let fs = require('fs')
var noteArray;

//reads the midi file and parses it at base64
fs.readFile('./midi.mid', 'base64', function (err,data){
    var midiArray = midiParser.parse(data);
    //console.log(midiArray.track[0].event[3]);
    //for each event on the first track, find a noteOn message (type 9) and print "noteOn"
    midiArray.track[0].event.forEach(function(element){
        if(element.type == 9){
            console.log('noteOn');
        };
    });
}
);







