var mouse = require('./')();

mouse.start();
mouse.on('click', function(key) {
	console.log('click %s down at %d,%d', key.button, key.x, key.y);
}).on('scroll', function(key) {
	console.log('scroll %s', key.button);
}).on('move', function(key) {
	console.log('move to %d,%d with %s button down', key.x, key.y, key.button);
}).on('other', function(d) {
	console.log('other', d);
});
