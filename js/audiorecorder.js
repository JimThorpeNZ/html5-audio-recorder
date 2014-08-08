YUI.add("audioRecorder", function (Y) {
    "use strict";
    Y.namespace('AudioRecorder');

    Y.AudioRecorder = Y.Base.create("audioRecorder", Y.Widget, [], {
        initializer: function () {
            this._uniqueAudioID = Y.guid();
            this._bufferLen = this.get("bufferLen") || 4096;
            this._source = this.get("audioInput");
            this._context = this._source.context;
            this._node = (this._context.createScriptProcessor || this._context.createJavaScriptNode).call(this._context, this._bufferLen, 2, 2);
            this._node.connect(this._context.destination);
            this._node._isRecording = false;
            this._node._recorderWorker = new Worker(this.get("recorderWorkerPath"));
            this._node._recorderWorker.postMessage({
                command: 'init',
                config: {
                    sampleRate: this._context.sampleRate
                }
            });
            this._node.onaudioprocess = function (event) {
                if (!this._isRecording) return;
                this._recorderWorker.postMessage({
                    command: 'record',
                    buffer: [
                        event.inputBuffer.getChannelData(0),
                        //event.inputBuffer.getChannelData(1)
                    ]
                });
            };
            this._node._recorderWorker.onmessage = function (event) {
                var audioBlob = event.data.audioBlob,
                    uniqueAudioID = event.data.uniqueAudioID,
                    fileReader = new FileReader(uniqueAudioID);
                fileReader.onload = function () {
                    var buffer = new Uint8Array(this.result);
                    Y.one('#' + uniqueAudioID).set('src', 'data:audio/wav;base64,' + Y.AudioRecorder.prototype.encode64(buffer));
                };
                fileReader.readAsArrayBuffer(audioBlob);
                Y.AudioRecorder.prototype.setVariable('audioBlob', audioBlob);
                // Y.AudioRecorder.setAttrs('audioBlob', audioBlob);
            };
            this._source.connect(this._node);
        },
        setVariable: function (thisVariable, value) {
            this[thisVariable] = value;
        },
        getVariable: function (thisVariable) {
            if (typeof(this[thisVariable]) != 'undefined') {
                return this[thisVariable];
            } else {
                return "error";
            }
        },
        renderUI: function () {
            this._recordButton = Y.Node.create(this.get("buttons.recordButton.value"));
            this._playButton = Y.Node.create(this.get("buttons.playButton.value"));
            this._pauseButton = Y.Node.create(this.get("buttons.pauseButton.value"));
            this._stopButton = Y.Node.create(this.get("buttons.stopButton.value"));
            this._uploadButton = Y.Node.create(this.get("buttons.uploadButton.value"));
            this._allButtons = [this._recordButton, this._playButton, this._pauseButton, this._stopButton, this._uploadButton];
            this._audioTag = Y.Node.create('<audio/>')
                .setAttrs({'controls': true, 'id': this._uniqueAudioID, 'src': ''});
            this.get("container")
                .addClass('btn-group')
                .append(Y.all(this._allButtons))
                .insert(this._audioTag, 'after');
        },
        bindUI: function () {
            this._disableButtons();
            this._setUIStateInit();
        },
        syncUI: function () {
        },
        destructor: function () {
        },
        _setUIStateInit : function () {
            this._recordButton.removeClass(this.get("classes.disabled.value"))
                .on("click", Y.bind(this._startRecording, this));
        },
        _setUIStateRecording : function () {
            this._disableButtons();
            this._recordButton.addClass(this.get("classes.recording.value"));
            Y.all([this._stopButton, this._recordButton]).removeClass(this.get("classes.disabled.value"))
                .on("click", Y.bind(this._stopRecording, this));
        },
        _setUIStateUpLoading : function () {
            this._disableButtons();
            this._uploadButton.one('i')
            	.removeClass(this.get("classes.upload.value"))
            	.addClass(this.get("classes.uploading.value"));
        },
        _setUIStateUpLoaded : function () {
            this._uploadButton.one('i')
            	.removeClass(this.get("classes.uploading.value"))
            	.addClass(this.get("classes.uploaded.value"));
        },
        _setUIStatePlayback : function () {
            this._disableButtons();
            this._enableButtons();
            this._recordButton.removeClass(this.get("classes.recording.value"))
                .on("click", Y.bind(this._startRecording, this));
            var _audioTag = Y.one(this._audioTag).getDOMNode();
            this._playButton.on('click', function (event) {
                    event.preventDefault();
                    this._startPlayBack(_audioTag);
                }, this, _audioTag);
            this._pauseButton.on('click', function (event) {
                    event.preventDefault();
                    this._pausePlayBack(_audioTag);
                }, this, _audioTag);
            this._stopButton.detach('click')
                .on('click', function (event) {
                        event.preventDefault();
                        this._stopPlayBack(_audioTag);
                    }, this, _audioTag);
            this._uploadButton.on('click', function (event) {
                    event.preventDefault();
                    this._setUIStateUpLoading();
                    this._wav2mp3(_audioTag);
                }, this, _audioTag);
        },
        _disableButtons : function () {
            Y.all(this._allButtons).addClass(this.get("classes.disabled.value"))
                .detach('click');
        },
        _enableButtons : function () {
            Y.all(this._allButtons).removeClass(this.get("classes.disabled.value"));
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
            this._node._recorderWorker.postMessage({
                command: 'clear'
            });
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
                bytes = new Uint8Array(buffer),
                len = bytes.byteLength;

            for (var i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[ i ]);
            }
            return window.btoa(binary);
        },
        _wav2mp3 : function () {
            var arrayBuffer,
                fileReader = new FileReader();

            fileReader.onload = function () {
                arrayBuffer = this.result;
                var buffer = new Uint8Array(arrayBuffer),
                    data = Y.AudioRecorder.prototype.parseWav(buffer);

                this._mp3Worker = new Worker(Y.AudioRecorder.ATTRS.mp3WorkerPath.value);
                this._mp3Worker.postMessage({
                    cmd: 'init',
                    config: {
                        mode: 3,
                        channels: 1,
                        samplerate: data.sampleRate,
                        bitrate: data.bitsPerSample
                    }
                });
                this._mp3Worker.postMessage({
                    cmd: 'encode',
                    buf: Y.AudioRecorder.prototype.Uint8ArrayToFloat32Array(data.samples)
                });
                this._mp3Worker.postMessage({
                    cmd: 'finish'
                });
                this._mp3Worker.onmessage = function (event) {
                    if (event.data.cmd == 'data') {
                        console.log("Done converting to Mp3");
                        var mp3Blob = new Blob([new Uint8Array(event.data.buf)], {type: 'audio/mp3'});
                        Y.AudioRecorder.prototype.uploadAudio(mp3Blob);
                    }
                };
            };
            fileReader.readAsArrayBuffer(Y.AudioRecorder.prototype.getVariable('audioBlob'));
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
            if (readInt(20, 2) != 1) {
                throw 'Invalid compression code, not PCM';
            }
            if (readInt(22, 2) != 1) {
                throw 'Invalid number of channels, not 1';
            }
            return {
                sampleRate: readInt(24, 4),
                bitsPerSample: readInt(34, 2),
                samples: wav.subarray(44)
            };
        },
        Uint8ArrayToFloat32Array : function (u8a) {
            var f32Buffer = new Float32Array(u8a.length);
            for (var i = 0; i < u8a.length; i++) {
                var value = u8a[i<<1] + (u8a[(i<<1) + 1]<<8);
                if (value >= 0x8000) {
                    value |= ~0x7FFF;
                }
                f32Buffer[i] = value / 0x8000;
            }
            return f32Buffer;
        },
        uploadAudio : function (mp3Data) {
            var reader = new FileReader();
            reader.onload = function (event) {
                var formData = new FormData(),
                    mp3Name = encodeURIComponent('audio_recording_' + new Date().getTime() + '.mp3');
                console.log("mp3name = " + mp3Name);
                formData.append('fname', mp3Name);
                formData.append('data', event.target.result);
console.log(Y);
console.log(Y.AudioRecorder);
console.log(Y.AudioRecorder.prototype);
console.log(Y.AudioRecorder.prototype._setUIStateUpLoaded);
                Y.AudioRecorder.prototype._setUIStateUpLoaded();
                console.log("move previous line to on success of upload.php")
                Y.io('upload.php', {
                    data: formData,
                    on: {
                        success: function (data) {
                            console.log(data);
                        }
                    }
                });
            };
            reader.readAsDataURL(mp3Data);
        }
    }, {
        ATTRS: {
            container: {
                value: null,
                setter: function (val) {
                    return Y.one(val) || Y.all(".videoRecorderControls");
                }
            },
            audioInput: {
                value: null
            },
            audioBlob: {
                value: 'string here'
            },
            recorderWorkerPath: {
                value: 'js/recorderWorker.js'
            },
            mp3WorkerPath: {
                value: 'js/mp3Worker.js'
            },
            buttons: {
            	value: {
	            	recordButton: {
	            		value: '<a class="btn btn-default" href="#"><i class="fa fa-circle"></i></a>'
	            	},
	            	playButton: {
	            		value: '<a class="btn btn-default" href="#"><i class="fa fa-play"></i></a>'
	            	},
	            	pauseButton: {
	            		value: '<a class="btn btn-default" href="#"><i class="fa fa-pause"></i></a>'
	            	},
	            	stopButton: {
	            		value: '<a class="btn btn-default" href="#"><i class="fa fa-stop"></i></a>'
	            	},
	            	uploadButton: {
	            		value: '<a class="btn btn-default" href="#"><i class="fa fa-upload"></i></a>'
	            	}
            	}
            },
            classes: {
            	value: {
	            	disabled: {
	            		value: 'disabled'
	            	},
	            	recording: {
	            		value: 'recording'
	            	},
	            	upload: {
	            		value: 'fa-upload'
	            	},
	            	uploading: {
	            		value: 'fa-spinner fa-spin'
	            	},
	            	uploaded: {
	            		value: 'fa-check complete'
	            	}
            	}
            }
        }
    });
}, "3.3.0", {
    requires: [
        "base-build",
        "widget"
    ]
});
/*
setVariable to setAttrs
blob
getVariable



remove console.log
*/