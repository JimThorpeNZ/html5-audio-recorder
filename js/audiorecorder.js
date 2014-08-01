
YUI.add("audio-recorder", function (Y) {
    "use strict";  
 
	Y.AudioRecorder = Y.Base.create("audio-recorder", Y.Widget, [], {
	    initializer: function () {
			// publish any events
			// do any instantiation that doesn't require DOM
			this._uniqueAudioID = Y.guid();
			this.blob = '';

			this._bufferLen = this.get("bufferLen") || 4096;
			this._source = this.get("input");
			this._context = this._source.context;
			this._node = (this._context.createScriptProcessor || this._context.createJavaScriptNode).call(this._context, this._bufferLen, 2, 2);
			this._node.connect(this._context.destination);
			this._node._isRecording = false;
			this._node._recorderWorker = new Worker( this.get("recorderWorker_path") );
			this._node._recorderWorker.postMessage({
				command: 'init',
				config: {
					sampleRate: this._context.sampleRate
				}
			});
			this._node.onaudioprocess = function(e){
				if (!this._isRecording) return;
				this._recorderWorker.postMessage({
					command: 'record',
					buffer: [
						e.inputBuffer.getChannelData(0),
						//e.inputBuffer.getChannelData(1)
					]
				});
			};
		    this._node._recorderWorker.onmessage = function(e){
console.log(Y.AudioRecorder.prototype);
Y.AudioRecorder.prototype.initializer.set('blob','blob');
				var blob = e.data.audioBlob,
					uniqueAudioID = e.data.uniqueAudioID,
					fileReader = new FileReader(uniqueAudioID);
				fileReader.onload = function(){
					var buffer = new Uint8Array(this.result);
					Y.one('#' + uniqueAudioID).set( 'src', 'data:audio/wav;base64,' + Y.AudioRecorder.prototype.encode64(buffer) );
			    };
			    fileReader.readAsArrayBuffer(blob);
		    };
			this._node._mp3Worker = new Worker( this.get("mp3Worker_path") );
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
				    this._wav2mp3(_audioTag);
				}, this, _audioTag);
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
	    	this._node._recorderWorker.postMessage({
				command: 'exportWAV',
				uniqueAudioID: this._uniqueAudioID,
				type: 'audio/wav'
			});
		    this._node._recorderWorker.postMessage({ command: 'clear' });
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
		},




		//Mp3 conversion
		_wav2mp3 : function(cb) {
			var arrayBuffer,
				fileReader = new FileReader();

			fileReader.onload = function(){
				arrayBuffer = this.result;
				var buffer = new Uint8Array(arrayBuffer),
			    	data = parseWav(buffer);
			    
			    console.log(data);
				console.log("Converting to Mp3");

			    this._mp3Worker.postMessage({
			    	cmd: 'init',
			    	config: {
				        mode: 3,
						channels: 1,
						samplerate: data.sampleRate,
						bitrate: data.bitsPerSample
				    }
				});

			    this._mp3Worker.postMessage({ cmd: 'encode', buf: Uint8ArrayToFloat32Array(data.samples) });
			    this._mp3Worker.postMessage({ cmd: 'finish'});
			    this._mp3Worker.onmessage = function(e) {
			        if (e.data.cmd == 'data') {
					
						console.log("Done converting to Mp3");
						
						/*var audio = new Audio();
						audio.src = 'data:audio/mp3;base64,'+encode64(e.data.buf);
						audio.play();*/
			            
						//console.log ("The Mp3 data " + e.data.buf);
						
						var mp3Blob = new Blob([new Uint8Array(e.data.buf)], {type: 'audio/mp3'});
						uploadAudio(mp3Blob);
						/*
						var url = 'data:audio/mp3;base64,'+encode64(e.data.buf);
						var li = document.createElement('li');
						var au = document.createElement('audio');
						var hf = document.createElement('a');
						  
						au.controls = true;
						au.src = url;
						au.id = "audioRecording";
						hf.href = url;
						hf.download = 'audio_recording_' + new Date().getTime() + '.mp3';
						hf.innerHTML = hf.download;
						li.appendChild(au);
						li.appendChild(hf);
						recordingslist.innerHTML = '';
						recordingslist.appendChild(li);
						*/
			        }
			    };
		    };
		  
		  fileReader.readAsArrayBuffer(blob);
		},		
		parseWav : function (wav) {
			function readInt(i, bytes) {
				var ret = 0,
					shft = 0;

				while (bytes) {
					ret += wav[i] << shft;
					shft += 8;
					i++;
					bytes--;
				}
				return ret;
			}
			if (readInt(20, 2) != 1) throw 'Invalid compression code, not PCM';
			if (readInt(22, 2) != 1) throw 'Invalid number of channels, not 1';
			return {
				sampleRate: readInt(24, 4),
				bitsPerSample: readInt(34, 2),
				samples: wav.subarray(44)
			};
		},
		Uint8ArrayToFloat32Array : function (u8a){
			var f32Buffer = new Float32Array(u8a.length);
			for (var i = 0; i < u8a.length; i++) {
				var value = u8a[i<<1] + (u8a[(i<<1)+1]<<8);
				if (value >= 0x8000) {
					value |= ~0x7FFF;
				}
				f32Buffer[i] = value / 0x8000;
			}
			return f32Buffer;
		},
		uploadAudio : function (mp3Data){
			var reader = new FileReader();
			reader.onload = function(event){
				var fd = new FormData(),
					mp3Name = encodeURIComponent('audio_recording_' + new Date().getTime() + '.mp3');
				console.log("mp3name = " + mp3Name);
				fd.append('fname', mp3Name);
				fd.append('data', event.target.result);
				/*Y.io('upload.php', {
				    data: fd,
				    on: {success: function(data) {
						//console.log(data);
						log.innerHTML += "\n" + data;
					}}
				});*/
				/*
				jQuery ajax call
				$.ajax({
					type: 'POST',
					url: 'upload.php',
					data: fd,
					processData: false,
					contentType: false
				}).done(function(data) {
					//console.log(data);
					log.innerHTML += "\n" + data;
				});
				*/
			};      
			reader.readAsDataURL(mp3Data);
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
		    recorderWorker_path: {
		    	value: 'js/recorderWorker.js'
			},
		    mp3Worker_path: {
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





