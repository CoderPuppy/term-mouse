# Term Mouse
### A mouse reporting interface

Based on [TooTallNate's gist](https://gist.github.com/1702813)

## Example
```javascript
var mouse = require('term-mouse')();

mouse
	.start()
	.on('click', function(e) {
		console.log('you clicked %d,%d with the %s mouse button', e.x, e.y, e.button);
	})
	.on('scroll', function(e) {
		console.log('you scrolled %s', e.button);
	});
```
