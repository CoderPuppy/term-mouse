var events = require('events');
var util   = require('util');
var Stream = require('stream');

var buttonNames = ['left', 'middle', 'right', 'none'];
function decodeBtn(v) {
	var e = {}
	e.shift = !!(v & 4);
	e.meta = !!(v & 8);
	e.control = !!(v & 16);
	if(v & 64) {
		e.name = 'scroll';
		e.button = v & 1 ? 'down' : 'up';
	} else {
		e.name = v & 32 ? 'move' : 'buttons';
		e.button = buttonNames[v & 3];
		e.btnNum = (v & 3) == 3 ? null : (v & 3) + 1;
		e.down = (v & 3) != 3;
	}
	return e;
}

var Mouse = module.exports = (function() {
	function Mouse(options) {
		if(!(this instanceof Mouse)) return new Mouse(options);

		this.options = options || {};

		this.input = this.options.input || process.stdin;
		this.output = this.options.output || process.stdout;
		this.utf8 = !!this.options.utf8;

		process.on('exit', function() {
			this.stop();
		}.bind(this));

		this._onData = this._onData.bind(this);

		// Support easier events such as up, down and click.
		this.on('buttons', function(e) {
			if(e.button == 'none') {
				this.emit('up', e);

				if(this._down) {
					this.emit('click', this._down, e);
				}
				this._down = false;
			} else {
				this.emit('down', e);
				this._down = e;
			}
		});
	}
	util.inherits(Mouse, events.EventEmitter);

	return (function() {
		var constructor = this,
		    prototype   = this.prototype;

		(function() {
			this.start = function start() {
				this.input.on('data', this._onData);
				this.input.resume();
				if(this.input.setRawMode)
					this.input.setRawMode(true)
				else
					require('tty').setRawMode(true)
				if(this.utf8) this.output.write('\x1b[?1005h'); // UTF 8
				this.output.write('\x1b[?1015h'); // urxvt ASCII
				this.output.write('\x1b[?1006h'); // xterm ASCII
				this.output.write('\x1b[?1003h'); // up, down, drag, move

				return this;
			};

			this._onData = function _onData(d) {
				this.emit('data', d);
				var other = [];
				sequences: for(var i = 0; i < d.length; i++) {
					var b = d.readUInt8(i);
					if(b == 0x1b && i < d.length - 1 && d.readUInt8(i + 1) == 0x5b) { // ^[[

						if(other.length > 0) {
							this.emit('other', new Buffer(other));
							other = [];
						}
						i += 2;
						var b = d.readUInt8(i);
						if(b == 0x4d /* M */) { // standard or UTF-8
							i++; // skip the M
							var e;
							if(this.utf8) {
								var s = d.toString('utf8', i);
								e = decodeBtn(s.charCodeAt(0) - 32);
								e.x = s.charCodeAt(1) - 32;
								e.y = s.charCodeAt(2) - 32;
								e.sequence = '\x1b[M' + s;
								var len = new Buffer(s.substr(0, 3), 'utf8').length;
								e.buf = d.slice(i - 3, i + len + 1);
								i += len - 1;
							} else {
								var s = d.slice(i - 3, i + 3);
								e = decodeBtn(d.readUInt8(i++));
								e.x = d.readUInt8(i++) - 32;
								e.y = d.readUInt8(i) - 32;
								e.sequence = s.toString('utf8');
								e.buf = s;
							}
							this.emit('event', e);
							this.emit(e.name, e);
						} else if(b == 0x3c /* < */) { // xterm ASCII
							var j = i;
							var data = [];
							while(true) {
								var v = d.readUInt8(i);
								data.push(v);
								if(i >= d.length) {
									throw new Error('bad');
								}
								if(v == 0x4d /* M */ || v == 0x6d /* m */) {
									break;
								}
								i++;
							}
							var down = data[data.length - 1] == 0x4d /* M */;
							data = new Buffer(data).toString('ascii');
							data = data.substring(1, data.length - 1).split(';').map(function(v) {
								return parseInt(v)
							});
							var e = decodeBtn(data[0]);
							if(!down) {
								e.button = 'none';
								e.down = false;
							}
							e.x = data[1];
							e.y = data[2];
							e.sequence = '\x1b[<' + data.join(';') + (down ? 'M' : 'm');
							e.buf = d.slice(j - 2, i + 1);
							this.emit('event', e);
							this.emit(e.name, e);
						} else if(b >= 0x30 /* 0 */ && b <= 0x39 /* 9 */) { // urxvt ASCII
							var j = i;
							var data = [];
							while(true) {
								var v = d.readUInt8(i);
								data.push(v);
								if(i >= d.length) {
									throw new Error('bad');
								}
								if(v == 0x4d /* M */) {
									break;
								}
								if(!((v >= 0x30 && v <= 0x39) || v == 0x3b)) { // 0-9;
									other = other.concat(data);
									continue sequences;
								}
								i++;
							}
							data = new Buffer(data).toString('ascii');
							data = data.substring(0, data.length - 1).split(';').map(function(v) {
								return parseInt(v) - 32
							});
							var e = decodeBtn(data[0]);
							e.x = data[1];
							e.y = data[2];
							e.sequence = '\x1b[' + data.map(function(v) { return v + 32 }).join(';') + 'M';
							e.buf = d.slice(j - 2, i + 1);
							this.emit('event', e);
							this.emit(e.name, e);
						}
					} else if(b == 0x03) { // ^C
						this.input.pause(); // TODO: I don't know if this is necessary
						if(other.length > 0) {
							this.emit('other', new Buffer(other));
							other = [];
						}
						this.emit('ctrl-c');
					} else {
						other.push(b);
					}
				}
				if(other.length > 0) {
					this.emit('other', new Buffer(other));
					other = [];
				}
			};

			this.stop = function stop() {
				this.input.removeListener('data', this._onData);
				this.input.pause();
				this.output.write('\x1b[?1003l');
				this.output.write('\x1b[?1005l');
				this.output.write('\x1b[?1015l');
				this.output.write('\x1b[?1006l');

				return this;
			};
		}).call(prototype);

		return this;
	}).call(Mouse);
})();
