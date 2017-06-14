# Term Mouse
### A mouse reporting interface

Originally based on [TooTallNate's gist](https://gist.github.com/1702813), rewritten to use all the mouse reporting modes.

## Example
```javascript
var mouse = require('term-mouse')();

mouse
	.start()
	.on('click', function(e) {
		console.log('you clicked %d,%d with the %s mouse button', e.x, e.y, e.button /* 'left', 'middle' or 'right' */);
	})
	.on('scroll', function(e) {
		console.log('you scrolled %s', e.button /* 'up' or 'down' */);
	});
```

## API

```javascript
var mouse = require('term-mouse')(options);
```

**Options**:
- `input` - the stream to read events from, defaults to `process.stdin`
- `output` - the stream to write control codes to, defaults to `process.stdout`
- `utf8` - whether to use UTF-8 (1005) reporting mode, this could break things if your terminal only supports the standard reporting mode or if you're using a non-UTF-8 locale

**Events**:
- `event` - `move`, `buttons` and `scroll`
- `move`
- `buttons` - when a button is pressed or released
- `scroll`
- `up` - when a button is pressed
- `down` - when a button is released
- `click` - `up` after `down`, here there are two event objects passed: the first is from when the button was pressed, the second is from the button being released

All of these include an event object:
- `shift` - whether the shift key is down
- `meta` - whether the meta (alt) key is down
- `ctrl` - whether the control key is down
- `name` - `'scroll'`, `'move'` or `'buttons'`
- `button` - `'left'`, `'middle'`, `'right'` or `'none'` if the button is released
- `btnNum` - the button that was pressed / released, if it's not using xterm's ASCII reporting mode then it'll be `null` when the button is released
- `down` - if the button is down
- `x` - the x coordinate of the cursor
- `y` - the y coordinate of the cursor
- `sequence` - the string that caused this event (if it's using the standard reporting mode, this could be incorrect because the real sequence is invalid UTF-8)
- `buf` - the sequence that caused this event as a buffer

## Useful References
I looked at http://invisible-island.net/xterm/ctlseqs/ctlseqs.html and https://www.systutorials.com/docs/linux/man/7-urxvt/ while making this.
