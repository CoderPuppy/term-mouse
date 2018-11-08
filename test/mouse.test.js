const test = require('ava');
const Mouse = require('../index');
const stream = require('stream');
const highland = require('highland');

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


test.cb('I can simulate a click', t => {
    const down = new Buffer('\u001b[32;60;8M');
    const up = new Buffer('\u001b[35;60;8M');
    const input = highland([down, up]);
    input.setRawMode = () => {}
    const output = new stream.Writable({
        write(chunk, encoding, callback) {
            callback();
        }
    })
    const mouse = new Mouse({ input, output });
    mouse.on('click', function(key) {
       try{
           t.is(key.button, 'left')
           t.is(key.down, true)
           t.is(key.name, 'buttons')
           t.is(key.x, 28);
           t.is(key.y, -24)
        } catch(err){
            t.end(err);
        }
       t.end();
    }).on('up', function(d) {
        try{
            t.deepEqual(d.buf, up)
        } catch(err){
            t.end(err);
        }
    }).on('down', function(d) {
        try{
            t.deepEqual(d.buf, down)
         } catch(err){
             t.end(err);
         }
    })
    mouse.start();
});
