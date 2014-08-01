
YUI.add("audio-recorder", function (Y) {
    "use strict";  
 
	Y.AudioRecorder = Y.Base.create("audio-recorder", Y.Widget, [], {
	    initializer: function () {
			// publish any events
			// do any instantiation that doesn't require DOM
			this._uniqueAudioID = Y.guid();

			this._bufferLen = this.get("bufferLen") || 4096;
			this._source = this.get("input");
			this._context = this._source.context;
			this._node = (this._context.createScriptProcessor || this._context.createJavaScriptNode).call(this._context, this._bufferLen, 2, 2);
			this._node.connect(this._context.destination);
			this._node._isRecording = false;
			this._node._worker = new Worker( this.get("worker_path") );
			// this._node._encoderWorker = new Worker( this.get("encoder_worker_path") );
			this._node._worker.postMessage({
				command: 'init',
				config: {
					sampleRate: this._context.sampleRate
				}
			});
			this._node.onaudioprocess = function(e, _isRecording, _worker){
				if (!this._isRecording) return;
				this._worker.postMessage({
					command: 'record',
					buffer: [
						e.inputBuffer.getChannelData(0),
						//e.inputBuffer.getChannelData(1)
					]
				});
			};
		    this._node._worker.onmessage = function(e){
				var blob = e.data.audioBlob,
					uniqueAudioID = e.data.uniqueAudioID,
				fileReader = new FileReader(uniqueAudioID);
				fileReader.onload = function(){
					var buffer = new Uint8Array(this.result);
					Y.one('#' + uniqueAudioID).set( 'src', 'data:audio/wav;base64,' + Y.AudioRecorder.prototype.encode64(buffer) );
					// Y.one('#' + uniqueAudioID).insert( Y.Node.create('<audio/>').setAttrs({'controls': true, 'src': 'data:audio/wav;base64,' + Y.AudioRecorder.prototype.encode64(buffer) }), 'after');
			    };
			    fileReader.readAsArrayBuffer(blob);
		    };
			this._source.connect(this._node);
	    },
	    renderUI: function () {
			// create all DOM nodes
			// store shortcuts for DOM you'll need to reference
			var buttonMarkUp = ['<a class="btn btn-default" href="#"><i class="fa ', '"></i></a>'];
			this._recordButton = Y.Node.create(buttonMarkUp[0] + 'fa-circle' + buttonMarkUp[1]);
			this._playButton = Y.Node.create(buttonMarkUp[0] + 'fa-play' + buttonMarkUp[1]);
			this._pauseButton = Y.Node.create(buttonMarkUp[0] + 'fa-pause' + buttonMarkUp[1]);
			this._stopButton = Y.Node.create(buttonMarkUp[0] + 'fa-stop' + buttonMarkUp[1]);
			this._uploadButton = Y.Node.create(buttonMarkUp[0] + 'fa-upload' + buttonMarkUp[1]);
			this._allButtons = [this._recordButton, this._playButton, this._pauseButton, this._stopButton, this._uploadButton];
			this._audioTag = Y.Node.create('<audio/>').setAttrs({'controls': true, 'id': this._uniqueAudioID, 'src': ''});

			// add nodes to the page all at once
			this.get("container").addClass('btn-group').append(Y.all(this._allButtons)).insert(this._audioTag, 'after');

	    },
	    bindUI: function () {
	    	this._disableButtons();
		    this._setUIStateInit();
	    },
	    syncUI: function () {
			// now that the DOM is created, syncUI sets it up
			// given the current state of our ATTRS
	    },
/*	    destructor: function () {
	        if (this.get("rendered")) {
		        // bindUI was called, clean up events
		        this._buttonClickHandler.detach();
		        this._buttonClickHandler = null;
		        // renderUI was called, clean up shortcuts
		        this._titleNode = this._buttonNode = null;
	        }
	    },*/
	    _setUIStateInit : function () {
		    this._recordButton.removeClass('disabled').on("click", Y.bind(this._startRecording, this));
	    },
	    _setUIStateRecording : function () {
			this._disableButtons();
			this._recordButton.addClass('recording');
			Y.all([this._stopButton, this._recordButton]).removeClass('disabled').on("click", Y.bind(this._stopRecording, this));
	    },
	    _setUIStatePlayback : function () {
			this._disableButtons();
			this._enableButtons();
			this._recordButton.removeClass('recording').on("click", Y.bind(this._startRecording, this));
			var _audioTag = Y.one(this._audioTag).getDOMNode();
			this._playButton.on('click', function(e) {
				    e.preventDefault();
				    this._startPlayBack(_audioTag);
				}, this, _audioTag);
			this._pauseButton.on('click', function(e) {
				    e.preventDefault();
				    this._pausePlayBack(_audioTag);
				}, this, _audioTag);
			this._stopButton.detach('click').on('click', function(e) {
				    e.preventDefault();
				    this._stopPlayBack(_audioTag);
				}, this, _audioTag);
			this._uploadButton.on('click', function(e) {
			    e.preventDefault();
			    alert('needs to convert and upload mp3');
			});
		},
		_disableButtons : function () {
			Y.all(this._allButtons).addClass('disabled').detach('click');
		},
		_enableButtons : function () {
			Y.all(this._allButtons).removeClass('disabled');
		},
		_startRecording : function () {
	    	this._node._isRecording = true;
	    	this._setUIStateRecording();
		},
		_stopRecording : function () {
	    	this._node._isRecording = false;
	    	this._node._worker.postMessage({
				command: 'exportWAV',
				uniqueAudioID: this._uniqueAudioID,
				type: 'audio/wav'
			});
		    this._node._worker.postMessage({ command: 'clear' });
	    	this._setUIStatePlayback();
		},
		_startPlayBack : function (_audioTag) {
		    _audioTag.play();
		},
		_pausePlayBack : function (_audioTag) {
		    _audioTag.pause();
		},
		_stopPlayBack : function (_audioTag) {
		    _audioTag.pause();
		    _audioTag.currentTime = 0;
		},
		encode64 : function(buffer) {
			var binary = '',
				bytes = new Uint8Array( buffer ),
				len = bytes.byteLength;

			for (var i = 0; i < len; i++) {
				binary += String.fromCharCode( bytes[ i ] );
			}
			return window.btoa( binary );
		}

	}, {
	    // Public attributes that broadcast change events
	    ATTRS: {
			container: {
		        value: null,
		        setter: function(val) {
		            return Y.one(val) || Y.one(".videoRecorderControls");
		        }
		    },
			input: {
		        value: null
		    },
		    worker_path: {
		    	value: 'js/recorderWorker.js'
			},
		    encoder_worker_path: {
		    	value: 'js/mp3Worker.js'
			}
	    }
	});
}, "3.3.0", {
	requires: [
		"base-build",
		"widget"
	]
});





