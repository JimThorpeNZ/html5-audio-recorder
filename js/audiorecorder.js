
/* global YUI */
YUI.add("audio-recorder", function (Y) {
    "use strict";  
 
	Y.AudioRecorder = Y.Base.create("audio-recorder", Y.Widget, [], {
	    initializer: function () {
			// publish any events
			// do any instantiation that doesn't require DOM
	    },
	    renderUI: function () {
			// create all DOM nodes
			var recordButton = Y.Node.create('<a class="btn btn-default" href="#" id="recordButton"><i class="fa fa-circle"></i></a>'),
				playButton = Y.Node.create('<a class="btn btn-default playerControl disabled" href="#" id="playButton"><i class="fa fa-play"></i></a>'),
				pauseButton = Y.Node.create('<a class="btn btn-default playerControl disabled" href="#" id="pauseButton"><i class="fa fa-pause"></i></a>'),
				stopButton = Y.Node.create('<a class="btn btn-default disabled" href="#" id="stopButton"><i class="fa fa-stop"></i></a>'),
				uploadButton = Y.Node.create('<a class="btn btn-default playerControl disabled" href="#" id="uploadButton"><i class="fa fa-upload"></i></a>'),
				audioTag = Y.Node.create('<audio/>').set('controls', true);
			      
			// use this.getClassName(arg1s...) to create unque classes
			// title.addClass(this.getClassName("title"));
			// button.addClass(this.getClassName("button"));

			// store shortcuts for DOM you'll need to reference
			this._recordButton = recordButton;
			this._playButton = playButton;
			this._pauseButton = pauseButton;
			this._stopButton = stopButton;
			this._uploadButton = uploadButton;
			this._allButtons = [recordButton, playButton, pauseButton, stopButton, uploadButton];
			this._audioTag = audioTag;

			// add nodes to the page all at once
			this.get("container").addClass('btn-group').append(Y.all(this._allButtons)).append(this._audioTag);
			
	    },
	    bindUI: function () {

		    recorder = new Recorder( this.get("input"), { audioTag: this._audioTag } );
		    __log('Recorder initialised.');
		    playback = new Playback();
		    __log('Playback initialised.');
		    // record = new Record();
		    // __log('Record initialised.');

		    // this._recordButton.on("click", this._startRecording);
		    this._recordButton.on("click", Y.bind(this._startRecording, this));

		    // this._enablePlayerControls;
/*
			// store references to event handlers you set on other
			// objects for clean up later
			this._buttonClickHandler = this._buttonNode.on("click", function (event) {
			Y.log("you clicked the button!");
			event.halt();
			}, this);
			// assign listeners to events on the instance directly
			// they're cleaned up automatically
			this.after("titleChange", this._afterTitleChange, this);
*/
	    },
	    // _afterTitleChange: function (event) {
	    //     this._titleNode.setContent(event.newVal);
	    // },
	    syncUI: function () {
			// now that the DOM is created, syncUI sets it up
			// given the current state of our ATTRS
			// this._afterTitleChange({
			// 	newVal: this.get("title")
			// });
	    },
	    destructor: function () {
	        if (this.get("rendered")) {
		        // bindUI was called, clean up events
		        this._buttonClickHandler.detach();
		        this._buttonClickHandler = null;
		        // renderUI was called, clean up shortcuts
		        this._titleNode = this._buttonNode = null;
	        }
	    },
	    _enablePlayerControls : function () {
			Y.all(this._allButtons).removeClass('disabled');
			// var audioRecording = document.getElementById('audioRecording');
			Y.one(this._playButton).on('click', function(e) {
			    e.preventDefault();
			    playback.startPlayBack(audioRecording);
			});
			Y.one(this._pauseButton).on('click', function(e) {
			    e.preventDefault();
			    playback.pausePlayBack(audioRecording);
			});
			Y.one(this._stopButton).detach('click');
			Y.one(this._stopButton).on('click', function(e) {
			    e.preventDefault();
			    playback.stopPlayBack(audioRecording);
			});
			Y.one(this._uploadButton).on('click', function(e) {
			    e.preventDefault();
			    alert('needs to convert and upload mp3');
			});
		},
		_disablePlayerControls : function () {
			Y.all(this._allButtons).addClass('disabled');
			Y.all(this._allButtons).detach('click');
		},
		_enableRecordingButtons : function () {
			this._recordButton.addClass('recording');
			this._stopButton.removeClass('disabled');
			this._stopButton.detach('click');
			this._stopButton.on("click", Y.bind(this._stopRecording, this));
			// Y.one(this._stopButton).on('click', function(e) {
			//     e.preventDefault();
		 //    	this._stopRecording();
			// });
		},
		_disableRecordingButtons : function () {
			Y.one(this._recordButton).removeClass('recording');
		},
		_startRecording : function () {
		    if (recorder) {
		    	this._disablePlayerControls();
		    	this._enableRecordingButtons();
		    	recorder.record();
		    	__log('Recording...');
		    }
		},
		_stopRecording : function () {
		    if (recorder) {
		    	recorder.stop();
			    __log('Stopped recording.');
		    	this._disableRecordingButtons();
		    	recorder.exportWAV(function(blob) {});
			    recorder.clear();
			    this._listenForPlayer();
		    }
		},
		_listenForPlayer : function () {
			if ( ! this._audioTag.src ) {
				setTimeout(this.listenForPlayer, 100);
				__log('not found player src');
			} else {
				__log('found player src');
				this._enablePlayerControls();
			}
		}
	}, {
	    // Public attributes that broadcast change events
	    ATTRS: {
			title: {
				value: "No one gave me a title :("
			},
			container : {
		        value: null,
		        setter: function(val) {
		            return Y.one(val) || Y.one(".videoRecorderControls");
		        }
		    },
			input : {
		        value: null
		    }
	    },
	    // Attributes whose default values can be scraped from HTML
	    HTML_PARSER: {
	        title: function (srcNode) {
	            return srcNode.getAttribute("title");
	        }
	    }
	});
}, "3.3.0", {
	requires: [
		"base-build", // provides Y.Base.create
		"widget"      // provides Y.Widget
	],
	group: "nfl",     // declares the nfl group (important for skins)
	skinnable: false   // declares that your module is skinned
});








/*
var PlaybackControls = function(input) {

    recorder = new Recorder(input);
    __log('Recorder initialised.');
    playback = new Playback();
    __log('Playback initialised.');
    record = new Record();
    __log('Record initialised.');

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

var Record = function() {

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
*/
var Playback = function() {

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
