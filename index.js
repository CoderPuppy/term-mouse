var events = require('events'),
    util   = require('util'),
    Stream = require('stream');

// var mouse = module.exports = function mouse(options) {
// 	return new Mouse(options);
// };

var Mouse = module.exports = (function() {
	function Mouse(options) {
		if(!(this instanceof Mouse)) return new Mouse(options);

		this.options = options || {};
		(function() {
			this.input  = process.stdin;
			this.output = process.stdout;
		}).call(this.options.__proto__);

		(function(self, options) {
			self.input = this.input instanceof Stream ? this.input : process.stdin;
			self.output = this.output instanceof Stream ? this.output : process.stdout;
		}).call(options, this, options);

		process.on('exit', function() {
			this.stop();
		}.bind(this));

		this._onData = this._onData.bind(this);

		// Support easier events such as up, down and click.
		this.on('buttons', function(e) {
			if(e.button == 'none') {
				this.emit('up', e);

				if(this._down) {
					this.emit('click', this._down);
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
				this._bind();
				this._resume();
				this._rawMode();
				this._sendStart();

				return this;
			};

			this._bind = function _bind() {
				this.input.on('data', this._onData);
			};

			this._resume = function _resume() {
				this.input.resume();
			};

			this._rawMode = function _rawMode() {
				if(this.input.setRawMode)
					this.input.setRawMode(true);
				else
					require('tty').setRawMode(true);
			};

			this._sendStart = function _sendStart() {
				this.output.write('\x1b[?1005h');
				this.output.write('\x1b[?1003h');
			};

			this._onData = function _onData(d) {
				this.emit('data', d);
				var s = d.toString('utf8');
				if (s === '\u0003') {
					process.stdin.pause();
				} else if (/^\u001b\[M/.test(s)) {
					// mouse event
					var modifier = s.charCodeAt(3);
					var e = {};
					e.shift = !!(modifier & 4);
					e.meta = !!(modifier & 8);
					e.ctrl = !!(modifier & 16);
					e.x = s.charCodeAt(4) - 32;
					e.y = s.charCodeAt(5) - 32;
					e.button = null;
					e.sequence = s;
					e.buf = Buffer(e.sequence);
					if ((modifier & 96) === 96) {
						e.name = 'scroll';
						e.button = modifier & 1 ? 'down' : 'up';
					} else {
						e.name = modifier & 64 ? 'move' : 'buttons';
						switch (modifier & 3) {
							case 0 : e.button = 'left'; break;
							case 1 : e.button = 'middle'; break;
							case 2 : e.button = 'right'; break;
							case 3 : e.button = 'none'; break;
							default : return;
						}
					}
					this.emit('event', e);
					this.emit(e.name, e);
				} else {
					this.emit('other', d, s);
				}
			};

			this.stop = function stop() {
				this._unbind();
				this._pause();
				this._sendStop();

				return this;
			};

			this._unbind = function _unbind() {
				this.input.removeListener('data', this._onData);
			};

			this._pause = function _pause() {
				this.input.pause();
			};

			this._sendStop = function _sendStop() {
				this.output.write('\x1b[?1005l');
				this.output.write('\x1b[?1003l');
			};
		}).call(prototype);

		return this;
	}).call(Mouse);
})();
