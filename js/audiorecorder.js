

var PlaybackControls = function(input) {

    recorder = new Recorder(input);
    __log('Recorder initialised.');
    playback = new Playback();
    __log('Playback initialised.');
    record = new Record(input);
    __log('Recorder initialised.');

	this.enablePlayerControls = function () {
		Y.all('.playerControl').removeClass('disabled');
		var audioRecording = document.getElementById('audioRecording');
		Y.one('#playButton').on('click', function(e) {
		    e.preventDefault();
		    playback.startPlayBack(audioRecording);
		});
		Y.one('#pauseButton').on('click', function(e) {
		    e.preventDefault();
		    playback.pausePlayBack(audioRecording);
		});
		Y.one('#stopButton').detach('click');
		Y.one('#stopButton').on('click', function(e) {
		    e.preventDefault();
		    playback.stopPlayBack(audioRecording);
		});
		Y.one('#uploadButton').on('click', function(e) {
		    e.preventDefault();
		    alert('needs to convert and upload mp3');
		});
	}

	this.disablePlayerControls = function () {
		Y.all('.playerControl').addClass('disabled');
		Y.all('.playerControl').detach('click');
	}

	this.enableRecordingButtons = function () {
		Y.one('#recordButton').addClass('recording');
		Y.one('#stopButton').removeClass('disabled');
		Y.one('#stopButton').detach('click');
		Y.one('#stopButton').on('click', function(e) {
		    e.preventDefault();
	    	record.stopRecording();
		});
	}

	this.disableRecordingButtons = function () {
		Y.one('#recordButton').removeClass('recording');
	}
};

window.PlaybackControls = PlaybackControls;

var Record = function(source, cfg) {

	// playbackFunction = this;

	this.startRecording = function () {
	    if (recorder) {
	    	playbackControls.disablePlayerControls();
	    	playbackControls.enableRecordingButtons();
	    	recorder.record();
	    	__log('Recording...');
	    }
	}

	this.stopRecording = function () {
	    if (recorder) {
	    	recorder.stop();
		    __log('Stopped recording.');
	    	playbackControls.disableRecordingButtons();
	    	recorder.exportWAV(function(blob) {});
		    recorder.clear();
		    this.listenForPlayer();
	    }
	}

	this.listenForPlayer = function () {
		if ( ! document.getElementById('audioRecording') ) {
			setTimeout(this.listenForPlayer, 100);
			__log('not found player in DOM');
		} else {
			__log('found player in DOM');
			playbackControls.enablePlayerControls();
		}
	}
};
window.Record = Record;

var Playback = function(source, cfg) {

	this.startPlayBack = function (audioRecording) {
	    audioRecording.play();
	    __log('Play Recording...');
	}

	this.pausePlayBack = function (audioRecording) {
	    audioRecording.pause();
	}

	this.stopPlayBack = function (audioRecording) {
	    audioRecording.pause();
	    audioRecording.currentTime = 0;
	}
};
window.Playback = Playback;

/*
window.addEventListener ("message", function(e){
  switch(e.data.command){
    case 'audioRecordingLoaded':
        enablePlayerControls();
        break;
  }
}, false);
*/


Y = YUI().use('node', function (Y) {
    Y.one('#recordButton').on('click', function(e) {
	    e.preventDefault();
	    console.log(recorder);
	    if ( ! this.hasClass('recording') ) {
	    // if ( ! recorder.recording ) {
	    	// console.log(recorder.recording);
	    	record.startRecording();
	    } else {
	    	record.stopRecording();
	    }
	});
});