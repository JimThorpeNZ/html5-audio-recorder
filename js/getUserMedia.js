
var audio_context,
	recorder;

function __log(e, data) {
    document.getElementById('log').innerHTML += "\n" + e + " " + (data || '');
    console.log(e + " " + (data || ''));
}

function startUserMedia(stream) {
    var input = audio_context.createMediaStreamSource(stream);
    __log('Media stream created.' );
	__log("input sample rate " + input.context.sampleRate);
    
    input.connect(audio_context.destination);
    __log('Input connected to audio context destination.');
    
    recorder = new Recorder(input);
    __log('Recorder initialised.');
}


Y = YUI().use('node', function (Y) {
    Y.one('#recordButton').on('click', function(e) {
	    e.preventDefault();
	    console.log(recorder);
	    if ( ! this.hasClass('recording') ) {
	    // if ( ! recorder.recording ) {
	    	// console.log(recorder.recording);
	    	startRecording();
	    } else {
	    	stopRecording();
	    }
	});
});


function startRecording() {
    if (recorder) {
    	disablePlayerControls();
    	enableRecordingButtons();
    	recorder.record();
    	__log('Recording...');
    }
}

function stopRecording() {
    if (recorder) {
    	recorder.stop();
	    __log('Stopped recording.');
    	disableRecordingButtons();
    	recorder.exportWAV(function(blob) {});
	    recorder.clear();
	    listenForPlayer();
    }
}

function listenForPlayer() {
	if ( ! document.getElementById('audioRecording') ) {
		setTimeout(listenForPlayer, 100);
		__log('not found player in DOM');
	} else {
		enablePlayerControls();
	}
}

function enablePlayerControls() {
	Y.all('.playerControl').removeClass('disabled');
	var audioRecording = document.getElementById('audioRecording');
	Y.one('#playButton').on('click', function(e) {
	    e.preventDefault();
	    startPlayBack(audioRecording);
	});
	Y.one('#pauseButton').on('click', function(e) {
	    e.preventDefault();
	    pausePlayBack(audioRecording);
	});
	Y.one('#stopButton').detach('click');
	Y.one('#stopButton').on('click', function(e) {
	    e.preventDefault();
	    stopPlayBack(audioRecording);
	});
	Y.one('#uploadButton').on('click', function(e) {
	    e.preventDefault();
	    alert('needs to convert and upload mp3');
	});
}

function disablePlayerControls() {
	Y.all('.playerControl').addClass('disabled');
	Y.all('.playerControl').detach('click');
}

function enableRecordingButtons() {
	Y.one('#recordButton').addClass('recording');
	Y.one('#stopButton').removeClass('disabled');
	Y.one('#stopButton').detach('click');
	Y.one('#stopButton').on('click', function(e) {
	    e.preventDefault();
    	stopRecording();
	});
}

function disableRecordingButtons() {
	Y.one('#recordButton').removeClass('recording');
}

function startPlayBack(audioRecording) {
    audioRecording.play();
    __log('Play Recording...');
}

function pausePlayBack(audioRecording) {
    audioRecording.pause();
}

function stopPlayBack(audioRecording) {
    audioRecording.pause();
    audioRecording.currentTime = 0;
}

window.onload = function init() {
    try {
        // webkit shim
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        navigator.getUserMedia = ( navigator.getUserMedia ||
                                    navigator.webkitGetUserMedia ||
                                    navigator.mozGetUserMedia ||
                                    navigator.msGetUserMedia);
        window.URL = window.URL || window.webkitURL;
        
        audio_context = new AudioContext;
        __log('Audio context set up.');
        __log('navigator.getUserMedia ' + (navigator.getUserMedia ? 'available.' : 'not present!'));
    } catch (e) {
        alert('No web audio support in this browser!');
    }
    
    navigator.getUserMedia({audio: true}, startUserMedia, function(e) {
        __log('No live audio input: ' + e);
    });
};


/*
window.addEventListener ("message", function(e){
  switch(e.data.command){
    case 'audioRecordingLoaded':
        enablePlayerControls();
        break;
  }
}, false);
*/