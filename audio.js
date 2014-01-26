var Audio = (function () {
    'use strict';

    function getContext() {
        'use strict';
        // コンテキストクラスの取得
        // Web Audio API が使えなければ
        // null を返す
        var contextClass = (
                window.AudioContext ||
                window.webkitAudioContext ||
                window.mozAudioContext ||
                window.oAudioContext ||
                window.msAudioContext);

        if (contextClass) {
            return new contextClass();
        } else {
            return null;
        }
    }

    function Buffer(context, url) {
        'use strict';
        this.context = context;
        this.url = url;
        this.buffer = null;
        //this.loadCount = 0;
    }

    Buffer.prototype.asyncLoad = function(callback, progressFunction) {
        'use strict';

        // Load buffer asynchronously
        var request = new XMLHttpRequest();
        request.open("GET", this.url, true);
        request.responseType = "arraybuffer";

        var loader = this;

        request.onload = function() {
            'use strict';
            // Asynchronously decode the audio file data in request.response
            loader.context.decodeAudioData(
                request.response,
                function(buffer) {
                    if (!buffer) {
                        alert('error decoding file data: ' + url);
                        return;
                    }
                    loader.buffer = buffer;
                    callback(loader.buffer, loader.context);
                  },
                  function(error) {
                    console.error('decodeAudioData error', error);
                }
            );
        };

        // onprogress
        // progressFunction (つまりundefined) の場合には
        // 何もしない
        if (progressFunction != undefined) {
            request.onprogress = progressFunction;
        }
        request.onerror = function() {
          alert('Buffer: XHR error');
        };

        request.send();
    };

    Buffer.prototype.play = function(time, offset, duration) {
        'use strict';
        var context = this.context;

        var source = context.createBufferSource();
        source.buffer = this.buffer;
        source.connect(context.destination);

        if (arguments.length == 1) {
            source.start(time);
        } else if (arguments.length == 2) {
            source.start(time, offset);
        } else if (arguments.length == 3) {
            source.start(time, offset, duration);
        } else {
            throw Error("playLinear: invalid arguments");
        }
    };

    Buffer.prototype.playLinear = function(time, offset, duration) {
        'use strict';

        var context = this.context;

        var source = context.createBufferSource();
        source.buffer = this.buffer;
        // gain node
        var gainNode = context.createGain();
        source.connect(gainNode);
        gainNode.connect(context.destination);
        // gain configuration
        gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0);
        gainNode.gain.linearRampToValueAtTime(1, context.currentTime + 5);
        gainNode.gain.linearRampToValueAtTime(1, context.currentTime + 10);
        gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 15);

        if (arguments.length == 1) {
            source.start(time);
        } else if (arguments.length == 2) {
            source.start(time, offset);
        } else if (arguments.length == 3) {
            source.start(time, offset, duration);
        } else {
            throw Error("playLinear: invalid arguments ");
        }
    };

    Buffer.prototype.playOscillator = function(type, frequency, detune, time, duration) {
        'use strict';

        var context = this.context;
        var oscNode = context.createOscillator();
        oscNode.frequency.value = frequency;
        oscNode.type = type;
        oscNode.detune.value = detune;
        oscNode.connect(context.destination);

        var currentTime = context.currentTime;
        var startTime = (currentTime > time) ? currentTime : time ;
        var stopTime = startTime + duration;

        if (arguments.length == 5) {
            oscNode.start(starttime);
            oscNode.stop(stopTime);
        } else {
            throw Error("playOscillator: lnvalid arguments");
        }
    };

    Buffer.prototype.playOscillatorFromArray = function(type, frequency, array) {
        'use strict';
        //
        // array の中身: {duration: float, detune: ...}
        //
        var context = this.context;
        var startTime = context.currentTime;

        for (var i = 0; i < array.length; i++) {
            var detune = array[i].detune;
            var duration = array[i].duration;
            this.playOscillator(
                    type, frequency, detune, startTime, duration);
            startTime = startTime + duration;
        }
    };

    return {
        getContext: getContext,
        Buffer: Buffer
    };
})();

Audio.Parameter = (function() {
    "use strict";

    var detune = {
        "-11": -1100,
        "-10": -1000,
        "-9" : -900,
        "-8" : -800,
        "-7" : -700,
        "-6" : -600,
        "-5" : -500,
        "-4" : -400,
        "-3" : -300,
        "-2" : -200,
        "-1" : -100,
        "0"  : 0,
        "+1" : 100,
        "+2" : 200,
        "+3" : 300,
        "+4" : 400,
        "+5" : 500,
        "+6" : 600,
        "+7" : 700,
        "+8" : 800,
        "+9" : 900,
        "+10": 1000,
        "+11": 1100
    };

    var ratio = Math.pow(2, 1/12);

    function rpow(num) {
        'use strict';
        return Math.pow(ratio, num);
    }

    var frequency = {
        "A3":  220,
        "A3S": 220 * rpow(1),
        "B3":  220 * rpow(2),
        "C3":  220 * rpow(3),
        "C3S": 220 * rpow(4),
        "D3":  220 * rpow(5),
        "D3S": 220 * rpow(6),
        "E3":  220 * rpow(7),
        "F3":  220 * rpow(8),
        "F3S": 220 * rpow(9),
        "G3":  220 * rpow(10),
        "G3S": 220 * rpow(11),
        "A4":  440,
        "A4S": 440 * rpow(1),
        "B4":  440 * rpow(2),
        "C4":  440 * rpow(3),
        "C4S": 440 * rpow(4),
        "D4":  440 * rpow(5),
        "D4S": 440 * rpow(5),
        "E4":  440 * rpow(7),
        "F4":  440 * rpow(8),
        "F4S": 440 * rpow(9),
        "G4":  440 * rpow(10),
        "G4S": 440 * rpow(11),
        "A5":  880,
        "A5S": 880 * rpow(1),
        "B5":  880 * rpow(2),
        "C5":  880 * rpow(3),
        "A6":  1760
    };

    return {
        detune: detune,
        frequency: frequency
    };
})();

// node module
if (typeof module !== "undefined" &&
        module.exports &&
        typeof require !== "undefined" &&
        require.main !== module)  {
    exports.Audio = Audio;
}
