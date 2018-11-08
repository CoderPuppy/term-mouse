const test = require('ava');
const {decodeBtn} = require('../index');


test('decodeBtn left', t => {
    t.deepEqual(decodeBtn(0), {
           btnNum: 1,
           button: 'left',
           control: false,
           down: true,
           meta: false,
           name: 'buttons',
           shift: false

          })
});

test('decodeBtn middle', t => {
    t.deepEqual(decodeBtn(1), {
           btnNum: 2,
           button: 'middle',
           control: false,
           down: true,
           meta: false,
           name: 'buttons',
           shift: false
          })
});

// maybe do more to capture logic of tests
