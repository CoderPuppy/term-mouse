const test = require('ava');
const Mouse = require('../index');
const stream = require('stream');

test('I can create a mouse with custom input and output', t => {
    const input = new stream.Readable();
    const output = new stream.Writable({
        write(chunk, encoding, callback) {
            callback();
        }
    })
    const mouse = new Mouse({ input, output });
    t.is(mouse.input, input);
    t.is(mouse.output, output);
});